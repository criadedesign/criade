/**
 * Shaders GLSL Monocromáticos de Estúdio para a Escultura 3D da Criade
 * Mantém 100% da peça fiel ao laranja institucional (#F47721), revelando
 * volumetria 3D, cortes radiais retos e chanfros apenas com variações puras
 * de luminância laranja, rim light Fresnel e granulação editorial procedural.
 */

export const criadeVertexShader = /* glsl */ `
  uniform float uTime;
  uniform vec2 uPointer;
  uniform float uHover;

  attribute float aSurfaceType;

  varying vec3 vNormalView;
  varying vec3 vViewDir;
  varying vec3 vLocalPos;
  varying float vSurfaceType;

  void main() {
    vLocalPos = position;
    vSurfaceType = aSurfaceType;

    // Micro-respiração harmônica sutil quando o cursor interage com a escultura
    vec3 displaced = position;
    float wave = sin(position.x * 5.0 + position.y * 4.0 + uTime * 1.8) * 0.003 * uHover;
    displaced += normal * wave;

    vec4 worldPosition = modelMatrix * vec4(displaced, 1.0);
    vec4 mvPosition = viewMatrix * worldPosition;
    vViewDir = normalize(-mvPosition.xyz);
    vNormalView = normalize(normalMatrix * normal);

    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const criadeOrangeFragmentShader = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec2 uPointer;
  uniform float uHover;
  uniform vec3 uColorCore;
  uniform vec3 uColorShadow;
  uniform vec3 uColorRim;
  uniform float uGrainIntensity;

  varying vec3 vNormalView;
  varying vec3 vViewDir;
  varying vec3 vLocalPos;
  varying float vSurfaceType;

  // Hash procedural livre de texturas externas (Zero-Asset Film Grain)
  float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  void main() {
    vec3 N = normalize(vNormalView);
    vec3 V = normalize(vViewDir);

    // 1. Luz Principal de Estúdio (suave e envolvente para preservar o laranja vibrante em toda a peça)
    vec3 keyDir = normalize(vec3(-0.48 + uPointer.x * 0.26, 0.68 + uPointer.y * 0.22, 0.92));
    float wrapLight = clamp(dot(N, keyDir) * 0.5 + 0.5, 0.0, 1.0);
    float sculptedTone = smoothstep(0.08, 0.95, wrapLight);

    // 2. Separação de planos 3D (face frontal vs. parede extrudada interna vs. corte radial reto)
    float frontAlignment = clamp(dot(N, vec3(0.0, 0.0, 1.0)) * 0.5 + 0.5, 0.0, 1.0);
    float planeFactor = clamp(sculptedTone * 0.65 + frontAlignment * 0.35, 0.0, 1.0);

    // 3. Fresnel sutil em laranja luminoso nas quinas chanfradas 3D
    float fresnel = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 2.8);

    // 4. Reflexo acetinado laranja reativo ao cursor (sem embranquecer e sem aspecto plástico)
    vec3 pointerLightDir = normalize(vec3(uPointer.x * 0.9, uPointer.y * 0.9, 1.1));
    vec3 H = normalize(pointerLightDir + V);
    float specBevel = pow(max(dot(N, H), 0.0), 30.0) * (0.14 + 0.14 * uHover);

    // Realce sutil nas tampas de corte radial para evidenciar a geometria 3D dentro da mesma família laranja
    float cutHighlight = smoothstep(0.4, 0.95, vSurfaceType) * 0.08;

    // Mistura estritamente dentro da paleta laranja Criade (#DF600F -> #F47721 -> #FF8B38)
    vec3 orangeBody = mix(uColorShadow, uColorCore, planeFactor);
    orangeBody = mix(orangeBody, uColorRim, clamp(fresnel * 0.48 + cutHighlight + specBevel, 0.0, 0.68));

    // 5. Granulação analógica sutil
    float grain = (hash12(gl_FragCoord.xy + fract(uTime * 0.37) * 100.0) - 0.5) * uGrainIntensity;
    vec3 finalColor = clamp(orangeBody + grain, 0.0, 1.0);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;
