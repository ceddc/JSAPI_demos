require([
  "esri/WebScene",
  "esri/views/SceneView",
  "esri/request"
], function (WebScene, SceneView, esriRequest) {

  let mode = "light";
  let webscene;

  const intro = document.getElementById("intro");
  const loading = document.getElementById("loading");
  const error = document.getElementById("error");

  const queryParams = document.location.search.substr(1);
  const result = {};

  queryParams.split("&").forEach(function(part) {
    var item = part.split("=");
    result[item[0]] = decodeURIComponent(item[1]);
  });
  const id = result.id;

  if (id) {
    setScene(id);
  } else {
    intro.classList.remove("hide");
  }

  esriRequest('./cities.json', {
    responseType: "json"
  })
    .then(function (response) {

      const cities = response.data.cities;
      const cityContainer = document.getElementById("cities");

      for (let i = 0; i < cities.length; i++) {
        const city = cities[i];
        const button = document.createElement("button");
        button.innerHTML = city.title;
        button.addEventListener("click", function (evt) {
          setScene(city.id);
          if (city.attribution) {
            document.getElementById("attribution").innerHTML = city.attribution + '. Made with <a href="" target="_blank">ArcGIS API for JavaScript</a>';
          }
        }.bind(city));
        cityContainer.appendChild(button);
      }
    })
    .catch(function(err) {
      console.log(err);
    });

  function setRenderer(layer) {

    const outlineColor = mode === "dark" ? [255, 255, 255, 0.8] : [0, 0, 0, 0.8];
    const fillColor = mode === "dark" ? [10, 10, 10, 0.1] : [255, 255, 255, 0.1];
    const size = mode === "dark" ? 2 : 1;

    const sketchEdges = {
      type: "sketch",
      color: outlineColor,
      size: size,
      extensionLength: 2
    };

    // this renderers all the layers with semi-transparent white faces
    // and displays the geometry with sketch edges
    const renderer = {
      type: "simple", // autocasts as new SimpleRenderer()
      symbol: {
        type: "mesh-3d",
        symbolLayers: [{
          type: "fill",
          material: {
            color: fillColor,
            colorMixMode: "replace"
          },
          edges: sketchEdges
        }]
      }
    };
    layer.renderer = renderer;

  }

  function createPresentation(slides) {

    const slideContainer = document.getElementById("slides");

    if (slides.length) {
      const slideList = document.createElement("ul");
      slideContainer.appendChild(slideList);
      slides.forEach(function(slide) {
        let slideElement = document.createElement("li");
        slideElement.id = slide.id;
        slideElement.classList.add("slide");
        let title = document.createElement("div");
        title.innerHTML = slide.title.text;
        slideElement.appendChild(title);

        slideElement.addEventListener("click", function() {
          view.goTo(slide.viewpoint);
        }.bind(slide));

        slideList.appendChild(slideElement);
      });
    }

  }

  function setScene(id) {

    document.getElementById("slides").innerHTML = "";
    document.getElementById("attribution").innerHTML = 'Made with <a href="" target="_blank">ArcGIS API for JavaScript</a>.';

    if (!intro.classList.contains("hide")) {
      intro.classList.add("hide");
    }
    if (!error.classList.contains("hide")) {
      error.classList.add("hide");
    }
    loading.classList.remove("hide");

    webscene = new WebScene({
      ground: {
        opacity: 0
      },
      basemap: null
    });

    const view = new SceneView({
      container: "viewDiv",
      map: webscene,
      alphaCompositingEnabled: true,
      environment: {
        background: {
          type: "color",
          color: [0, 0, 0, 0]
        },
        starsEnabled: false,
        atmosphereEnabled: false
      },
      ui: {
        components: ["attribution"]
      }
    });

    const origWebscene = new WebScene({
      portalItem: {
        id: id
      }
    });

    origWebscene.loadAll().then(function () {
      const sceneLayers = origWebscene.allLayers.filter(function(layer) {
        return (layer.type === "scene");
      });
      sceneLayers.forEach(function (layer) {
        if (layer && layer.type === "scene") {
          setRenderer(layer);
          layer.popupEnabled = false;
        }
      });

      webscene.addMany(sceneLayers);

      view.goTo(origWebscene.initialViewProperties.viewpoint)
      .then(function() {
        loading.classList.add("hide");
      })
      .catch(function(err) {
        console.log(err);
      });

      webscene.presentation = origWebscene.presentation.clone();
      createPresentation(webscene.presentation.slides);
    })
    .catch(function() {
      loading.classList.add("hide");
      error.classList.remove("hide");
    });

    window.view = view;
  }

  document.getElementById("mode").addEventListener("click", function (evt) {

    if (mode === "light") {
      mode = "dark";
      evt.target.innerHTML = "Pencil";
      document.getElementById("customCSS").href = "./styles/dark.css";
    } else {
      mode = "light";
      evt.target.innerHTML = "Chalk";
      document.getElementById("customCSS").href = "./styles/light.css";
    }
    if (webscene) {
      webscene.layers.forEach(function (layer) {
        setRenderer(layer);
      });
    }
  });
});
