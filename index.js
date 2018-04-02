function main() {
  
    let MAP_MODE = true;
    let TEXTBOX_MODE = false;
    let INFO_MODE = false;
    let USER_INPUT = "";
    let MAP;
    let MARKERS = [];
    
    function initializePage() {
      handleClickOnSearchSection();
      handleSearchButton();
      handleTextboxTyping();
      initializeMap();
      handleClickOnMap();
    }  
    
    function initializeMap() {
      console.log(`ran initializeMap`);
      MAP = new google.maps.Map(document.getElementById('map_container'), {
        center: {lat: 0, lng: 0},
        zoom: 2 ,
        minZoom : 2 ,
        maxZoom : 6 ,
        mapTypeId: google.maps.MapTypeId.HYBRID ,
        mapTypeControl: false,
        streetViewControl: false,
        styles : [
        {featureType : "road.arterial" , elementType : "all" , stylers : [{ "visibility" : "off"}]} ,
        {featureType : "transit" , elementType : "all" , stylers : [{ "visibility" : "off"}]} ,
        {featureType : "locality" , elementType : "labels" , stylers : { "visibility": "off" }}
        ] 
        });
      showTeleportCities();
      
      MAP.addListener("zoom_changed", function() {
        showTeleportCities();
      });
    }
    
    // Grab all cities from the stored variable TELEPORTCITIES. The if statement only allows a fraction of cities to be placed on the map using the downstream function.  Essentially, the more zoomed in the map is, the more cities that will display.
    function showTeleportCities() {
      clearMarkers();
      console.log(`ran getTeleportCities`);
      Object.keys(TELEPORTCITIES).forEach(function(cityName, index) {
        let zoomScale = ((MAP.maxZoom - MAP.minZoom) - (MAP.getZoom() - MAP.minZoom))*4;
        if (zoomScale === 0 || (index + 2)% zoomScale === 0) { // The (index + 2) vs (index) only selects more interesting cities.
          displayTeleportCity(cityName);
        }
      });
    } 
    
    function clearMarkers() {
      for (var i = 0; i < MARKERS.length; i++) {
        MARKERS[i].setMap(null);
      }
      MARKERS = [];
    }
    
    //Given a simple cityName (ex: "Austin"), accesses Teleport API to get city details, then uses those details to add a Marker to the MAP.
    function displayTeleportCity(cityName) {
      const general_settings = {
        url : `https://api.teleport.org/api/cities/` ,
        data : {
          search : `${cityName}` ,
          limit : 7
        } ,
        dataType : `json` ,
        type : `GET` ,
        success : function(data) {
          if (verifyTeleportDataNotEmpty(data)) {
            let city = data._embedded[`city:search-results`][0];
            let cityDetails = getTeleportCityInfo(city);
            addMarker(cityDetails);
          }
        } ,
        error : failedSearch ,
      };
      $.ajax(general_settings);
    }
    
    // Adds a marker to the MAP given cityDetail which include a fullName (Austin, Texas, United States) and latLng coordinates
    function addMarker(cityDetail) {
      let image = {
        url : `https://upload.wikimedia.org/wikipedia/en/e/e5/Purple_sphere.svg` ,
        size : new google.maps.Size(24, 24) ,
        origin : new google.maps.Point(0, 0) ,
        anchor : new google.maps.Point(12, 12)
      };
      let shape = {
        coords: [0, 0, 0, 25, 25, 25, 25, 0],
        type: 'poly'
      };
      let marker = new google.maps.Marker({
        position: cityDetail[`latLng`],
        map: MAP ,
        //icon : image , 
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          strokeColor : "yellow",
          scale: 6
        } ,
        //label : "O" ,
        shape : shape ,
        title : cityDetail[`fullName`] ,
      });
      MARKERS.push(marker);
      marker.addListener("click", function() {
         processMapCityClick(cityDetail);
      });
    }
    
    function processMapCityClick(city) {
      processInput(city[`fullName`]);
    }
    
    function handleClickOnSearchSection() {
      $(".search-section").click(function() {
        startTextboxMode();
      });
    }
    
    // Change dispalys to show TEXTBOX_MODE and fade map to background.
    //*** Add class="faded untouchable" to (map)
    function startTextboxMode() {
      console.log(`ran handleTextPromptActivate`);
      addHighlightedClass(".search-button");
      removeHiddenClass(".search-textbox");
      removeHiddenClass("#map_container");
      addHiddenClass(".info-section");
      removeFadedClass(".search-section");
      addFadedClass("#map_container");
        
      TEXTBOX_MODE = true;
      MAP_MODE = false;
      INFO_MODE = false;
    }
    
    // If the textbox is already up and has user input inside, clicking the search icon will begin the text-based search for a city.
    function handleSearchButton() {
      $(".search-button").click(function(event) {
        event.preventDefault();
        if (TEXTBOX_MODE === true) {
          getUserTextboxInput();
          if (USER_INPUT !== "") {
            processInput(USER_INPUT);
          }
        }
      });
    }
    
    function handleTextboxTyping() {
      $(".search-textbox").change(function() {
        startTextboxMode();
        getUserTextboxInput();
        showPredictiveSearch(USER_INPUT);
      });
    }
    
    // WORK IN PROGRESS
    // Will contact Teleport's API to show results based on what is currently in the textbox.
    function showPredictiveSearch(input) {
      console.log(`ran showPredictiveSearch`);
      console.log(input);
      const general_settings = {
        url : `https://api.teleport.org/api/cities/` ,
        data : {
          search : `${input}` ,
          limit : 7
        } ,
        dataType : "json" ,
        type : 'GET' ,
        success : showPredictiveText ,
        error : failedPredictiveSearch ,
        Accept: "application/vnd.teleport.v1+json" ,
      };
      $.ajax(general_settings);
    }
    
    // WORK IN PROGRESS
    function showPredictiveText(data, status) {
      console.log(`showPredictiveText`);
      //console.log(data);
    }
    
    function failedPredictiveSearch(jx, status) {
      console.log(`Failed to grab info from Teleport API.`);
    }
    
    function getUserTextboxInput() {
      USER_INPUT = $(".search-textbox").val();
    }
    
    /////////////////////////////////////////////////////////
    /////////////////// INFO_MODE ///////////////////
    /////////////////////////////////////////////////////////
    
  // In TEXTBOX_MODE, On click of 'search icon':
  // Search user input in city database of Teleport API
  // input could come from text search or map city click.
    function processInput(input) {
      console.log(`ran processInput`);
      console.log(input);
      const general_settings = {
        url : `https://api.teleport.org/api/cities/` ,
        data : {
          search : `${input}` ,
          limit : 7
        } ,
        dataType : `json` ,
        type : `GET` ,
        success : startInfoMode ,
        error : failedSearch ,
      };
      $.ajax(general_settings);
    }
    
    function failedSearch(error) {
      console.log(`City failed to load.`);
    }
    
    
    // If processInput(input) is sucessful after user uses search function, this function grabs the first city object from data and will show Teleport/Wikipedia information if available.
    function startInfoMode(data) {
      console.log(`ran startInfoMode`);
      showAllInfo(data);
      
      removeHighlightedClass(".search-button");
      removeHiddenClass(".info-section");
      addHiddenClass("#map_container");
      addFadedClass(".search-section");
      
      MAP_MODE = false;
      INFO_MODE = true;
    }
    
    function showAllInfo(data) {
      $(".info-section").empty();
      //console.log(data);
      if (verifyTeleportDataNotEmpty(data)) {
        const firstCity = data._embedded[`city:search-results`][0];
        console.log(firstCity);
        showTeleportCityInfo(firstCity);
        showWikipediaInfo(firstCity[`matching_full_name`]);
      } 
      else {
        displayNoSearchResults();
      }
    }
    
    function verifyTeleportDataNotEmpty(data) {
      return !jQuery.isEmptyObject(data._embedded[`city:search-results`]);
    }
    
    function displayNoSearchResults() {
      $(".info-section").html("There is no information for this city in our database.");
    }
    
    // Variable (city) is a collection of very simple data on a specific city. We need more. This function retrieves more detailed info on a city from Teleport's API. Then displays in on the webpage.
    function showTeleportCityInfo(city) {
      //console.log(city);
      const cityDetails = getTeleportCityInfo(city);
      displayFullName(cityDetails);
      displayTeleportCityInfo(cityDetails);
    }
    
    // Input received is Teleport's basic information on one city (an object). Ajax call to get more detailed info on the given city.
    function getTeleportCityInfo(city) {
      const link = city[`_links`][`city:item`][`href`];
      let cityDetails = ``;
      const general_settings = {
        url : link ,
        dataType : `json` ,
        type : `GET` ,
        async : false ,
        success : function(data) {
          cityDetails = getTeleportCityDetails(data);
        } ,
        error : failedSearch 
      };
      $.ajax(general_settings);
  
      return cityDetails;
    }
    
    // Variable (data) has more information on a specific city from Teleport API, retrieved using it's geonameid.  This functions
    // Write this description in more detail.
    function getTeleportCityDetails(data) {
      let cityDetails = {
        cityName : data.name ,
        closestUrbanCity : null ,
        fullName : data.full_name ,
        latLng : { lat : data[`location`][`latlon`][`latitude`] , lng : data[`location`][`latlon`][`longitude`] } ,
        geohash : data[`location`][`geohash`]
      };
      if (data[`_links`].hasOwnProperty(`city:urban_area`)) {
        cityDetails[`closestUrbanCity`] = data[`_links`][`city:urban_area`].name;
      }
      return cityDetails;
    }
    
    function displayFullName(cityDetails) {
      $(`.info-section`).html(`<h2>Results for ${cityDetails[`fullName`]}</h2>`);
    }
    
    function displayTeleportCityInfo(cityDetails) {
      if (cityDetails[`closestUrbanCity`] === null) {
        $(`.info-section`).append(`<h3>There are no large cities close to ${cityDetails[`cityName`]}.</h3>`);
      } 
      else {
        if (cityDetails[`closestUrbanCity`] !== cityDetails[`cityName`]) {
          $(`.info-section`).append(`<h3>We have extensive data on ${cityDetails[`closestUrbanCity`]}, a nearby city.</h3>`);
        }
        else {
          $(`.info-section`).append(`<h3>We have extensive data on this city.</h3>`);
        }
        const cityKey = convertNameToReferenceKey(cityDetails[`closestUrbanCity`]);
        $(`.info-section`).append(`<div class=teleport-info><a class="teleport-widget-link" href="https://teleport.org/cities/${cityKey}/">Life quality score</a><script async class="teleport-widget-script" data-url="https://teleport.org/cities/${cityKey}/widget/scores/?currency=USD&citySwitcher=false" data-max-width="770" src="https://teleport.org/assets/firefly/widget-snippet.min.js"></script>
        </div>`);
      }
    }
    
    // Teleport must receive a lowercase, dash-spaced city name to properly display the widget. This function changes the current name for a version suitable for calling back the API needed.
    
    function convertNameToReferenceKey(urbanName) {
      const answer = urbanName.replace(/\s/g,"-").replace(/,|\./g,"").toLowerCase();
      console.log(answer);
      return answer;
    }
    
    // As I can't make synchronous calls with jsonp files, I can't return statements to this function as originally intended (like showTeleportCityInfo, which has displayTeleportCityInfo). I'll have to move displayWikipediaInfo into a success callback downstream.   
    function showWikipediaInfo(city) {
      console.log(city);
      getWikipediaEntry(city);
    }
    
    function getWikipediaEntry(city) {
      console.log(`ran getWikipediaEntry`);
      const general_settings = {
        url : `https://en.wikipedia.org/w/api.php?action=query&format=json&list=search&srsearch=${city}` ,
        dataType : `jsonp` ,
        type : "GET" ,
        success : getWikiEntryIntro ,
        error : failedWiki
      };
      $.ajax(general_settings);
    }
    
    function failedWiki(error) {
      console.log(`Wiki search failed.`);
    }
    
    function getWikiEntryIntro(data) {
      const wikiEntry = data[`query`][`search`][0];
      const pageid = wikiEntry[`pageid`];
      const general_settings = {
        url : `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&format=json&exintro=&pageids=${pageid}` ,
        type : `GET` ,
        dataType : `jsonp` ,
        async : false ,
        success : function(data) {
          getIntroHtml(data, pageid);
        } ,
        error : failedWiki
      };
      $.ajax(general_settings);
    }
  
    function getIntroHtml(data, pageid) {
      const cityDetails = {
        name : data[`query`][`pages`][pageid][`title`] ,
        introHtml : data[`query`][`pages`][pageid][`extract`]
      };
      //console.log(cityDetails);
      displayWikipediaInfo(cityDetails);
    }
    
    function displayWikipediaInfo(cityDetails) {
      console.log(`ran displayWikipediaInfo`);
      $(`.info-section`).append(`<h3>The wikipedia summary for ${cityDetails[`name`]}.</h3>`);
      const text = removeHtmlFormatting(cityDetails[`introHtml`])
      //console.log(text);
      $(`.info-section`).append(`${text}`);
    }
    
    // Come back to this when you can, this has <p> tags without their complementary </p> tag.
    // \/?
    function removeHtmlFormatting(str) {
      //console.log(str);
      str = str.replace(/<br>/gi, "\n");
      //str = str.replace(/<p>/gi, "\n");
      str = str.replace(/<[^p](?:.|\s)*?>/g, "");
      return str;
    }
  
    /////////////////////////////////////////////////////////
    /////////////////// MAP_MODE ///////////////////
    /////////////////////////////////////////////////////////
    
    function handleClickOnMap() {
      $("#map_container").click(function() {
        console.log(`ran handleClickOnMap`);
        removeHighlightedClass(".search-button");
        addHiddenClass(".search-textbox");
        addHiddenClass(".info-section");
        removeFadedClass("#map_container");
        removeFadedClass(".search-section");
        
        TEXTBOX_MODE = false;
        INFO_MODE = false;
        MAP_MODE = true;
      });
    }
    
    /////////////////////////////////////////////////////////
    /////////////////// SECTION PROPERTIES ///////////////////
    /////////////////////////////////////////////////////////
    
    function addHighlightedClass(section) {
      $(section).addClass("highlighted");
    }
    
    function removeHighlightedClass(section) {
      $(section).removeClass("highlighted");
    }
    
    function addHiddenClass(section) {
      //$(section).fadeOut(3000);
      $(section).addClass("hidden");
    }
    
    function removeHiddenClass(section) {
      $(section).removeClass("hidden");
      //$(section).fadeIn(3000);
    }
    
    function addFadedClass(section) {
      $(section).fadeTo("slow", 0.2);
      
    }
    
    function removeFadedClass(section) {
      $(section).fadeTo("slow", 1.0);
    }
    
   $(initializePage)
  }
  
  $(main);
  
  
  ///////////////////////////////////////////////////////
  //////////////////////////////////////////////////////
  // Google Maps API key = AIzaSyAumFZS6Z3sMzKvUhIEWVMHlvapHLe62j8
  
  /**
   * 
   *
  
  Activate 'initial setting':
  - Display 'choose a region to explore, or select a city'
  
  On click of "Zoom Out" button:
  - if (zoomed out to largest size), activate 'initial setting'.
  
  
   *   
   * TODO:
   * Predictive Text search.
   * Include link to wikipedia page for searched city.
   * Use CSS to overlay the different sections.
   * **/