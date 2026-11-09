/**
 * Pipeline de Preparação de Modelo 3D (Model Preparation - glTF 2.0 Binary .glb)
 * Constrói e otimiza a escultura arquitetônica 3D do símbolo da Criade com:
 *  - Topologia indexada limpa (Uint16Array) sem vértices órfãos
 *  - Chanfros (bevels) analíticos para captura realista de rim light e Fresnel GLSL
 *  - Normais separadas por grupos de suavização (faces curvas suaves + cortes radiais retos)
 *  - Nós independentes na árvore glTF ('Criade_Arch_Ring', 'Criade_Orbital_Sphere', 'Criade_Inner_Accent_Ring')
 *    permitindo animação cinética individual em WebGL.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const OUT_PATH = resolve('public/models/criade-sculpture.glb');

/**
 * Gera perfil 2D retangular chanfrado no plano (r, z) em sentido anti-horário (CCW),
 * retornando coordenadas (r, z) e normais analíticas (nr, nz).
 */
function buildChamferedProfile(rMin, rMax, zMin, zMax, bevel, bevelSteps = 3) {
  const profile = [];
  const corners = [
    { cx: rMax - bevel, cz: zMax - bevel, a0: 0, a1: Math.PI / 2 },
    { cx: rMin + bevel, cz: zMax - bevel, a0: Math.PI / 2, a1: Math.PI },
    { cx: rMin + bevel, cz: zMin + bevel, a0: Math.PI, a1: (3 * Math.PI) / 2 },
    { cx: rMax - bevel, cz: zMin + bevel, a0: (3 * Math.PI) / 2, a1: Math.PI * 2 },
  ];

  for (const c of corners) {
    for (let s = 0; s <= bevelSteps; s++) {
      const t = s / bevelSteps;
      const ang = c.a0 + (c.a1 - c.a0) * t;
      const nr = Math.cos(ang);
      const nz = Math.sin(ang);
      profile.push({
        r: c.cx + bevel * nr,
        z: c.cz + bevel * nz,
        nr,
        nz,
      });
    }
  }
  return profile;
}

/**
 * Constrói um anel arquitetônico aberto extrudado com tampas radiais retas.
 */
function buildArchitecturalArcMesh({
  rMin,
  rMax,
  zMin,
  zMax,
  bevel,
  bevelSteps,
  thetaStartDeg,
  thetaEndDeg,
  arcSteps,
}) {
  const profile = buildChamferedProfile(rMin, rMax, zMin, zMax, bevel, bevelSteps);
  const P = profile.length;
  const theta0 = (thetaStartDeg * Math.PI) / 180;
  const theta1 = (thetaEndDeg * Math.PI) / 180;

  const positions = [];
  const normals = [];
  const uvs = [];
  const surfaceType = [];
  const indices = [];

  const pushVertex = (x, y, z, nx, ny, nz, u, v, sType) => {
    const idx = positions.length / 3;
    positions.push(x, y, z);
    normals.push(nx, ny, nz);
    uvs.push(u, v);
    surfaceType.push(sType);
    return idx;
  };

  // 1. Malha varrida (Swept Ring Body) — aSurfaceType = 0.0 (ou 0.5 nos chanfros próximos aos cortes)
  for (let i = 0; i <= arcSteps; i++) {
    const u = i / arcSteps;
    const theta = theta0 + (theta1 - theta0) * u;
    const cosT = Math.cos(theta);
    const sinT = Math.sin(theta);
    const nearCut = i <= 2 || i >= arcSteps - 2 ? 0.45 : 0.0;

    for (let j = 0; j <= P; j++) {
      const pj = profile[j % P];
      const v = j / P;
      pushVertex(
        pj.r * cosT,
        pj.r * sinT,
        pj.z,
        pj.nr * cosT,
        pj.nr * sinT,
        pj.nz,
        u,
        v,
        nearCut
      );
    }
  }

  const ringStride = P + 1;
  for (let i = 0; i < arcSteps; i++) {
    for (let j = 0; j < P; j++) {
      const a = i * ringStride + j;
      const b = (i + 1) * ringStride + j;
      const c = (i + 1) * ringStride + (j + 1);
      const d = i * ringStride + (j + 1);
      indices.push(a, b, c, a, c, d);
    }
  }

  // 2. Tampa Radial Inicial (theta0) — Corte arquitetônico seco (aSurfaceType = 1.0)
  const rMid = (rMin + rMax) * 0.5;
  const zMid = (zMin + zMax) * 0.5;
  const cos0 = Math.cos(theta0);
  const sin0 = Math.sin(theta0);
  const nStartX = sin0;
  const nStartY = -cos0;

  const startCenterIdx = pushVertex(
    rMid * cos0,
    rMid * sin0,
    zMid,
    nStartX,
    nStartY,
    0,
    0.5,
    0.5,
    1.0
  );
  const startCapRing = [];
  for (let j = 0; j < P; j++) {
    const pj = profile[j];
    startCapRing.push(
      pushVertex(
        pj.r * cos0,
        pj.r * sin0,
        pj.z,
        nStartX,
        nStartY,
        0,
        (pj.r - rMin) / (rMax - rMin),
        (pj.z - zMin) / (zMax - zMin),
        1.0
      )
    );
  }
  for (let j = 0; j < P; j++) {
    indices.push(startCenterIdx, startCapRing[j], startCapRing[(j + 1) % P]);
  }

  // 3. Tampa Radial Final (theta1) — Corte arquitetônico seco (aSurfaceType = 1.0)
  const cos1 = Math.cos(theta1);
  const sin1 = Math.sin(theta1);
  const nEndX = -sin1;
  const nEndY = cos1;

  const endCenterIdx = pushVertex(
    rMid * cos1,
    rMid * sin1,
    zMid,
    nEndX,
    nEndY,
    0,
    0.5,
    0.5,
    1.0
  );
  const endCapRing = [];
  for (let j = 0; j < P; j++) {
    const pj = profile[j];
    endCapRing.push(
      pushVertex(
        pj.r * cos1,
        pj.r * sin1,
        pj.z,
        nEndX,
        nEndY,
        0,
        (pj.r - rMin) / (rMax - rMin),
        (pj.z - zMin) / (zMax - zMin),
        1.0
      )
    );
  }
  for (let j = 0; j < P; j++) {
    indices.push(endCenterIdx, endCapRing[(j + 1) % P], endCapRing[j]);
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    uvs: new Float32Array(uvs),
    surfaceType: new Float32Array(surfaceType),
    indices: new Uint16Array(indices),
  };
}

/**
 * Constrói esfera UV otimizada centrada na origem para o nó orbital da Criade.
 */
function buildSphereMesh(radius = 0.142, widthSegments = 40, heightSegments = 28) {
  const positions = [];
  const normals = [];
  const uvs = [];
  const surfaceType = [];
  const indices = [];

  for (let iy = 0; iy <= heightSegments; iy++) {
    const v = iy / heightSegments;
    const phi = v * Math.PI;
    const sinPhi = Math.sin(phi);
    const cosPhi = Math.cos(phi);

    for (let ix = 0; ix <= widthSegments; ix++) {
      const u = ix / widthSegments;
      const theta = u * Math.PI * 2;
      const nx = -Math.cos(theta) * sinPhi;
      const ny = cosPhi;
      const nz = Math.sin(theta) * sinPhi;

      positions.push(radius * nx, radius * ny, radius * nz);
      normals.push(nx, ny, nz);
      uvs.push(u, 1 - v);
      surfaceType.push(0.35);
    }
  }

  const stride = widthSegments + 1;
  for (let iy = 0; iy < heightSegments; iy++) {
    for (let ix = 0; ix < widthSegments; ix++) {
      const a = iy * stride + ix;
      const b = iy * stride + ix + 1;
      const c = (iy + 1) * stride + ix + 1;
      const d = (iy + 1) * stride + ix;

      if (iy !== 0) indices.push(a, d, b);
      if (iy !== heightSegments - 1) indices.push(b, d, c);
    }
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    uvs: new Float32Array(uvs),
    surfaceType: new Float32Array(surfaceType),
    indices: new Uint16Array(indices),
  };
}

function computeMinMaxVec3(arr) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < arr.length; i += 3) {
    for (let k = 0; k < 3; k++) {
      if (arr[i + k] < min[k]) min[k] = arr[i + k];
      if (arr[i + k] > max[k]) max[k] = arr[i + k];
    }
  }
  return { min, max };
}

/**
 * Empacota múltiplas malhas nomeadas em um único arquivo binário glTF 2.0 (.glb).
 */
function exportBinaryGLB(nodesSpec) {
  const binChunks = [];
  let byteOffset = 0;

  const bufferViews = [];
  const accessors = [];
  const meshes = [];
  const nodes = [];

  const appendTypedArray = (typedArr, target) => {
    const raw = Buffer.from(typedArr.buffer, typedArr.byteOffset, typedArr.byteLength);
    const padLen = (4 - (raw.length % 4)) % 4;
    const padded = padLen > 0 ? Buffer.concat([raw, Buffer.alloc(padLen, 0)]) : raw;

    const viewIndex = bufferViews.length;
    bufferViews.push({
      buffer: 0,
      byteOffset,
      byteLength: raw.length,
      target,
    });

    binChunks.push(padded);
    byteOffset += padded.length;
    return viewIndex;
  };

  for (const spec of nodesSpec) {
    const { name, geometry, translation } = spec;
    const { min, max } = computeMinMaxVec3(geometry.positions);

    const posView = appendTypedArray(geometry.positions, 34962);
    const posAcc = accessors.length;
    accessors.push({
      bufferView: posView,
      componentType: 5126,
      count: geometry.positions.length / 3,
      type: 'VEC3',
      min,
      max,
    });

    const normView = appendTypedArray(geometry.normals, 34962);
    const normAcc = accessors.length;
    accessors.push({
      bufferView: normView,
      componentType: 5126,
      count: geometry.normals.length / 3,
      type: 'VEC3',
    });

    const uvView = appendTypedArray(geometry.uvs, 34962);
    const uvAcc = accessors.length;
    accessors.push({
      bufferView: uvView,
      componentType: 5126,
      count: geometry.uvs.length / 2,
      type: 'VEC2',
    });

    const surfView = appendTypedArray(geometry.surfaceType, 34962);
    const surfAcc = accessors.length;
    accessors.push({
      bufferView: surfView,
      componentType: 5126,
      count: geometry.surfaceType.length,
      type: 'SCALAR',
    });

    const idxView = appendTypedArray(geometry.indices, 34963);
    const idxAcc = accessors.length;
    accessors.push({
      bufferView: idxView,
      componentType: 5123,
      count: geometry.indices.length,
      type: 'SCALAR',
    });

    const meshIndex = meshes.length;
    meshes.push({
      name: `${name}_Mesh`,
      primitives: [
        {
          attributes: {
            POSITION: posAcc,
            NORMAL: normAcc,
            TEXCOORD_0: uvAcc,
            _SURFACETYPE: surfAcc,
          },
          indices: idxAcc,
          mode: 4,
        },
      ],
    });

    const nodeObj = { name, mesh: meshIndex };
    if (translation) nodeObj.translation = translation;
    nodes.push(nodeObj);
  }

  const rootNodeIndex = nodes.length;
  nodes.push({
    name: 'Criade_Sculpture_Root',
    children: nodesSpec.map((_, idx) => idx),
  });

  const gltfJson = {
    asset: {
      version: '2.0',
      generator: 'Criade Studio 3D Model Preparation Pipeline',
    },
    scene: 0,
    scenes: [{ name: 'CriadeHeroScene', nodes: [rootNodeIndex] }],
    nodes,
    meshes,
    accessors,
    bufferViews,
    buffers: [{ byteLength: byteOffset }],
  };

  const jsonBytes = Buffer.from(JSON.stringify(gltfJson), 'utf8');
  const jsonPad = (4 - (jsonBytes.length % 4)) % 4;
  const jsonChunkData =
    jsonPad > 0 ? Buffer.concat([jsonBytes, Buffer.alloc(jsonPad, 0x20)]) : jsonBytes;

  const binChunkData = Buffer.concat(binChunks);

  const totalLength = 12 + 8 + jsonChunkData.length + 8 + binChunkData.length;
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0); // 'glTF'
  header.writeUInt32LE(2, 4); // version 2
  header.writeUInt32LE(totalLength, 8);

  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonChunkData.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4); // 'JSON'

  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(binChunkData.length, 0);
  binHeader.writeUInt32LE(0x004e4942, 4); // 'BIN\0'

  return {
    glbBuffer: Buffer.concat([header, jsonHeader, jsonChunkData, binHeader, binChunkData]),
    stats: {
      bytes: totalLength,
      kb: (totalLength / 1024).toFixed(2),
      vertices: nodesSpec.reduce((acc, s) => acc + s.geometry.positions.length / 3, 0),
      triangles: nodesSpec.reduce((acc, s) => acc + s.geometry.indices.length / 3, 0),
    },
  };
}

// 1. Anel Principal Laranja Criade (#F47721) com cortes arquitetônicos em 63° e 381° (abertura centrada em +42°)
const mainRing = buildArchitecturalArcMesh({
  rMin: 0.56,
  rMax: 0.84,
  zMin: -0.118,
  zMax: 0.118,
  bevel: 0.026,
  bevelSteps: 2,
  thetaStartDeg: 63,
  thetaEndDeg: 381,
  arcSteps: 80,
});

// 2. Esfera Orbital Criade posicionada exatamente na abertura superior-direita (+42°)
const gapAngleRad = (42 * Math.PI) / 180;
const orbitalSphere = buildSphereMesh(0.142, 32, 22);

const { glbBuffer, stats } = exportBinaryGLB([
  { name: 'Criade_Arch_Ring', geometry: mainRing },
  {
    name: 'Criade_Orbital_Sphere',
    geometry: orbitalSphere,
    translation: [0.7 * Math.cos(gapAngleRad), 0.7 * Math.sin(gapAngleRad), 0.038],
  },
]);

mkdirSync(dirname(OUT_PATH), { recursive: true });
writeFileSync(OUT_PATH, glbBuffer);

console.log(
  `[Model Preparation] Gerado ${OUT_PATH} -> ${stats.kb} KB | ${stats.vertices} vértices | ${stats.triangles} triângulos`
);
