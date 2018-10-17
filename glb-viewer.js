/**
# inline glb viewer
*/

(async () => {
  const script_root = document.currentScript.src.match(/(.*\/).*?$/)[1];

  const script = url => new Promise(resolve => {
    const tag = document.createElement('script');
    tag.src = script_root + url;
    tag.addEventListener('load', resolve);
    document.body.appendChild(tag);
  });

  const walktree = (node, f) => {
    f(node);
    if (node.children.length) {
      node.children.forEach(child => walktree(child, f));
    }
  };

  const process = model => {
    walktree(model, n => {
      if (! n.material || n.material.name !== 'glass') {
        n.castShadow = true;
        n.receiveShadow = true; 
      }
    });
  };

  await script('third-party/three.min.js');
  await script('third-party/GLTFLoader.js');

  const glb_links = [...document.querySelectorAll('a')].filter(a => a.href.endsWith('.glb'));
  glb_links.forEach(async a => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    canvas.style.display = 'block';
    a.parentElement.insertBefore(canvas, a);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera( 40, 1, 0.1, 1000 );
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    const loader = new THREE.GLTFLoader();
    const load = async path => {
      return await new Promise(resolve => loader.load(path, gltf => resolve(gltf)));
    };

    const sunlight = new THREE.DirectionalLight(0xddeeff, 1.25);
    sunlight.castShadow = true;
    sunlight.position.set(10, 10, 10);
    scene.add(sunlight);
    sunlight.shadow.mapSize.width = 2048;
    sunlight.shadow.mapSize.height = 2048;
    sunlight.shadow.camera.near = 0.01;
    sunlight.shadow.camera.far = 500;

    const ambient = new THREE.AmbientLight(0x303030);
    scene.add(ambient);

    camera.position.z = 4;
    camera.position.y = 0.5;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize( canvas.width, canvas.height );
    const gltf = await load(a.href);
    process(gltf.scene);
    scene.add(gltf.scene);
    console.log(gltf);
    renderer.render( scene, camera );
  });
})();