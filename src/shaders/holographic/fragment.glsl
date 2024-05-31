uniform float uTime;
uniform vec3 uColor;
uniform float uLineWork;

varying vec3 vPosition;
varying vec3 vNormal;

void main()
{

  // Normal
  vec3 normal = normalize(vNormal);
  if(!gl_FrontFacing) 
    normal *= - 1.0;
  

  // Stripes
  float stripes = mod((vPosition.y - uTime * 0.02) * 20.0, 1.0);
  // USed to control sharpness of stripes
  stripes = pow(stripes, 25.0);

  // Fresnel
  vec3 viewDirection = normalize(vPosition - cameraPosition);
  float fresnel = dot(viewDirection, normal) + 1.0;
  //pushes effect to outsides
  fresnel = pow(fresnel, 2.0);

  // Falloff
  float falloff = smoothstep(0.8, uLineWork, fresnel);

  // Holographic
  float holographic = stripes * fresnel;
  holographic += fresnel * 1.25;
  holographic *= falloff;


  gl_FragColor = vec4(uColor, holographic);

  #include <tonemapping_fragment>
  #include <colorspace_fragment>

}