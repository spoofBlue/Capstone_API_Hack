let MAP;

// As the HTML loads, the Google Maps API is called.  Once successful, initMap() is called, displaying the MAP for the user.  After completetion of the map. Remainder of program begins.
function initMap() {
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
  main();
}

function main() {
  
  // Globals
  let MAP_MODE = true;
  let TEXTBOX_MODE = false;
  let INFO_MODE = false;
  let USER_INPUT = "";
  let MARKERS = [];
  
  //First function in main() called, this initializes many handlers.  Then places first MAP markers and shows intro.
  function initializePage() {
    handleSearchButton();
    handleExitButton();
    handleEscKeyboardPress();
    handleClickOnMap();
    
    initializeMapCities();
    startIntroMode();
  }  
  
  // Presents Intro section.  Note: Could have made implemented most these properties in initial HTML, but allowed this section to be easily removable.
  function startIntroMode() {
    removeHiddenClass(".help_section");
    removeHiddenClass(".exit_button");
    addHiddenClass(".search_section");
    addFadedClass("#map_container");
    
    setUserFocus(".exit_button");
  }

  /////////////////////////////////////////////////////////
  /////////////////// TEXTBOX_MODE ///////////////////
  /////////////////////////////////////////////////////////

  // Sets the user's input from the textbox into the global value USER_INPUT.
  function getUserTextboxInput() {
    USER_INPUT = $(".search_textbox").val();
  }
  
  // Change dispalys to show TEXTBOX_MODE and fade map to background.  Shows help section as well.
  function startTextboxMode() {
    addHighlightedClass(".search_button");
    removeHiddenClass(".search_textbox");
    removeHiddenClass(".exit_button");
    removeHiddenClass("#map_container");
    removeHiddenClass(".help_section");
    addHiddenClass(".info_section");
    removeFadedClass(".search_section");
    addFadedClass("#map_container");
    reassignAltTitleAttribute(".search_button", "Search City");
    fillSearchHelpSection();
    
    setUserFocus(".search_textbox");
      
    TEXTBOX_MODE = true;
    MAP_MODE = false;
    INFO_MODE = false;
  }
  
  // Changes HTML of the help section to Textbox Modes helpful tips.
  function fillSearchHelpSection() {
    if (! $(`.help_section`).hasClass("search_help")) {
      $(`.help_section`).addClass("search_help");
      $(`.help_section`).html(`<h2>Here are some ideas for cities to search!</h2>
        <ul><li>A potential vacation spot! Many major cities have leisure and culture statistics.</li>
        <li>Where you grew up. Some Wikipedia entries have a surprising history!</li>
        <li>Looking to move? Check out a major city for cost of living details.</li>
        <li>You can always zoom into the map to spark your curiosity.</li>
        </ul>`);
    }
    
  }
  
  // On click of the search button, sets up text-based search mode.
  // If the textbox is already up and has user input inside, clicking the search button will begin the text-based search for a city.
  function handleSearchButton() {
    $(".search_button").click(function(event) {
      startTextboxMode();
      event.preventDefault();
      if (TEXTBOX_MODE === true) {
        getUserTextboxInput();
        if (USER_INPUT !== "") {
          processInput(USER_INPUT);
        }
      }
    });
  }
  
  /////////////////////////////////////////////////////////
  /////////////////// INFO_MODE ///////////////////
  /////////////////////////////////////////////////////////
  
// Given input from either the text-based search or the cityName provided by a clicked Google Maps city.
// Ajax call searches user input in city database of Teleport API.  Success moves user to Info Mode.
  function processInput(input) {
    const general_settings = {
      url : `https://api.teleport.org/api/cities/` ,
      data : {
        search : `${input}` ,
        limit : 3
      } ,
      dataType : `json` ,
      type : `GET` ,
      success : startInfoMode ,
      error : displayNoSearchResults
    };
    $.ajax(general_settings);
  }
  
  function failedSearch(error) {
    console.log(`Minor Teleport error" ${error}`);
  }
  
  // data is the search results of the user's input from Teleport API. 
  // Passed on data to function utilizing data. Changes display to show Info Mode by hiding MAP, search section, and showing info section.
  function startInfoMode(data) {
    showAllInfo(data);
    
    addHiddenClass(".search_section");
    addHiddenClass("#map_container");
    addHiddenClass(".help_section");
    removeHighlightedClass(".search_button");
    removeHiddenClass(".info_section");
    
    INFO_MODE = true;
  }
  
  // data is the search results of the user's input from Teleport API.
  // Function gets first city result from data and gives query to functions to display relevant Teleport and Wikipedia info.
  function showAllInfo(data) {
    $(".info_section").empty();
    if (verifyTeleportDataNotEmpty(data)) {
      const firstCity = data._embedded[`city:search-results`][0];
      showTeleportCityInfo(firstCity);
      showWikipediaInfo(firstCity[`matching_full_name`]);
    } 
    else {
      displayNoSearchResults();
    }
  }
  
  // data is the search results of the user's input from Teleport API.
  // Checks to make sure there are any search results.
  function verifyTeleportDataNotEmpty(data) {
    return !jQuery.isEmptyObject(data._embedded[`city:search-results`]);
  }
  
  // Notifies user there are no search results for their city.
  function displayNoSearchResults() {
    $(".info_section").html(`<h1 aria-live="assertive">There is no information for this city in our database.</h1>`);
    removeHiddenClass(".exit_button");

    setUserFocus(`.exit_button`);
  }
  
  // Variable (city) is a collection of very simple data on a specific city. We need more.
  // This function retrieves more detailed info on a city from Teleport's API. Sends details to display-functions.
  function showTeleportCityInfo(city) {
    const cityDetails = getTeleportCityInfo(city);
    displayBasicInfoContent(cityDetails);
    displayTeleportCityInfo(cityDetails);
    
    setUserFocus(".city_found");
  }
  
  // Variable (city) is Teleport's basic information on one city (an object). 
  // Ajax call to get more detailed info on the given city. Success returns city's details, after function organizes data into easily accessible object.
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
  
  // Variable (data) has more detail on a specific city from Teleport API.
  // This function organizes details into easily readable object.
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
  
  // cityDetails is object with various properties of a city.
  // Displays conclusion of search to user, and lays down template to insert remaining data.
  function displayBasicInfoContent(cityDetails) {
    $(`.info_section`).append(`
      <div class=info_section_background></div>
      <h1 class="city_found">Results for ${cityDetails[`fullName`]}</h1> 
      <div class="teleport_info"></div>
      <div class="wikipedia_info" aria-live="assertive"></div>
    `);
    removeHiddenClass(".exit_button");
  }
  
  // cityDetails is object with various properties of a city.
  // Displays the Teleport widget only if cityDetails shows result is near a city with extensive Teleport data.
  function displayTeleportCityInfo(cityDetails) {
    if (cityDetails[`closestUrbanCity`] === null) {
      $(`.teleport_info`).append(`<h2>There are no large cities close to ${cityDetails[`cityName`]}.</h2>`);
    } 
    else {
      if (cityDetails[`closestUrbanCity`] !== cityDetails[`cityName`]) {
        $(`.teleport_info`).append(`<h2>We have extensive data on ${cityDetails[`closestUrbanCity`]}, a nearby city. Click on a category for more details.</h2>`);
      }
      else {
        $(`.teleport_info`).append(`<h2>We have extensive data on this city. Click on a category for more details.</h2>`);
      }
      const cityKey = convertNameToReferenceKey(cityDetails[`closestUrbanCity`]);
      $(`.teleport_info`).append(`<div class=teleport_widget><a class="teleport-widget-link" href="https://teleport.org/cities/${cityKey}/">Life quality score</a><script async class="teleport-widget-script" data-url="https://teleport.org/cities/${cityKey}/widget/scores/?currency=USD&citySwitcher=false" data-max-width="770" src="https://teleport.org/assets/firefly/widget-snippet.min.js"></script>
      </div>`);
    }
  }
  
  // Teleport must receive a lowercase, dash-spaced city name to properly display the widget. This function changes the current name for a version suitable for calling back the API needed.
  function convertNameToReferenceKey(urbanName) {
    const answer = urbanName.replace(/\s/g,"-").replace(/,|\./g,"").toLowerCase();
    return answer;
  }
  
  // Variable (city) is Teleport's basic information on one city (an object). 
  // Function searchs for this city in their database. Success uses search results.
  function showWikipediaInfo(city) {
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
  
  // data is the search results for a city in Wikipedia.
  // Functions gets first result and requests HTML text from Wikipedia.
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

  // data includes details on for Wikipedia's city search (first entry), pageid identifies relevant Wikipedia page.
  // Function makes an object from the title and the page's introduction HTML, passes it on.
  function getIntroHtml(data, pageid) {
    const cityDetails = {
      name : data[`query`][`pages`][pageid][`title`] ,
      introHtml : data[`query`][`pages`][pageid][`extract`]
    };
    displayWikipediaInfo(cityDetails);
  }
  
  // cityDetails has an object with Variable (name) which is a city, and (introHTML) the HTML for the page introduction.
  // Displays the name and the introduction to the HTML page.
  function displayWikipediaInfo(cityDetails) {
    $(`.wikipedia_info`).empty();
    $(`.wikipedia_info`).append(`<h2>The wikipedia summary for ${cityDetails[`name`]}.</h2>`);
    const text = removeHtmlFormatting(cityDetails[`introHtml`]);
    $(`.wikipedia_info`).append(`${text}`);
  }
  
  // str is HTML.
  // Function removes almost all HTML elements except span and paragraph elements.
  function removeHtmlFormatting(str) {
    str = str.replace(/<br>/gi, "\n");
    str = str.replace(/<[^p](?:.|\s)*?>/g, "");
    return str;
  }
  
  // On click of exit button, page will exit help, search, or info sections.
  function handleExitButton() {
    $("main").on("click", ".exit_button", function() {
      exitSection();
    });
  }
  
  // On keyboard press of Esc key, page will exit help, search, or info sections. keyCode 27 => Esc
  function handleEscKeyboardPress() {
    $(document).keyup(function(event) {
      if (event.keyCode === 27) {
       exitSection();
      }
    });
  }
  
  //  Change which section user returns to, based on current location when requesting exit.
  function exitSection() {
    if (INFO_MODE === true) {
      if (MAP_MODE === true) {
        startMapMode();
      } else if (TEXTBOX_MODE === true) {
        startTextboxMode();
        }
    } else {
        startMapMode();
    }
  }

  /////////////////////////////////////////////////////////
  /////////////////// MAP_MODE ///////////////////
  /////////////////////////////////////////////////////////
  
  // Although Google Maps is initialized thanks to initMap(), this function must place the city markers on the map.  Event listener on zoom puts on or removes markers based on zoom.
  function initializeMapCities() {
    showInitialCities();
    
    MAP.addListener("zoom_changed", function() {
      if (MAP.getZoom() > MAP.minZoom) {
        showTeleportCities();
      } else {
        clearMarkers();
      }
    });
  }
  
  // Grab all cities from TELEPORTCITIES in cities.database.js. The for/if statement only allows a fraction of cities to be placed on the map using the equation.  Essentially, the more zoomed in the map is, the more cities that will display.
  function showTeleportCities() {
    clearMarkers();
    Object.keys(TELEPORTCITIES).forEach(function(cityName, index) {
      let zoomMax = MAP.maxZoom - MAP.minZoom;
      let zoomCurr = MAP.getZoom() - MAP.minZoom;
      if (index % zoomMax < (zoomCurr)) {
        displayTeleportCity(cityName);
      }
    });
  } 
  
  // Gets all cities from INITIALCITIES from cities_database.js and displays on map as markers in next function.
  function showInitialCities() {
    Object.keys(INITIALCITIES).forEach(function(cityName) {
      displayTeleportCity(cityName);
    });
  }
  
  // Clears all markers that aren't the INITIALCITIES markers.
  function clearMarkers() {
    let initialCitiesLength = Object.keys(INITIALCITIES).length;
    for (let i = MARKERS.length - 1; i >= initialCitiesLength; i--) {
      MARKERS[i].setMap(null);
      MARKERS.splice(i, 1);
    }
  }
  
  // cityName is a simple city name (ex: "Austin").
  // Function accesses Teleport API to get city details, then uses those details to add a Marker to the MAP.
  function displayTeleportCity(cityName) {
    const general_settings = {
      url : `https://api.teleport.org/api/cities/` ,
      data : {
        search : `${cityName}` ,
        limit : 3
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
  
  // cityDetail is an object which includes fullName and (Austin, Texas, United States) and latLng coordinates.
  // Adds a marker to the MAP using cityDetail.
  function addMarker(cityDetail) {
    let shape = {
      coords: [0, 0, 0, 25, 25, 25, 25, 0],
      type: 'poly'
    };
    let marker = new google.maps.Marker({
      position: cityDetail[`latLng`],
      map: MAP ,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        strokeColor : "yellow",
        scale: 5
      } ,
      shape : shape ,
      title : cityDetail[`fullName`] ,
    });
    
    MARKERS.push(marker);

    // When this marker is clicked, get the fullName from cityDetail and present information on the city.
    marker.addListener("click", function() {
       processInput(cityDetail[`fullName`]);
    });
  }
  
  // On click of the MAP, Map mode begins.
  function handleClickOnMap() {
    $("#map_container").click(function() {
      startMapMode();
    });
  }
  
  // Displays Map mode.  Hidding the help, search, and info sections and unhiding and unfading the MAP.
  function startMapMode() {
    removeHighlightedClass(".search_button");
    addHiddenClass(".search_textbox");
    addHiddenClass(".info_section");
    addHiddenClass(".exit_button");
    addHiddenClass(".help_section");
    removeHiddenClass("#map_container");
    removeHiddenClass(".search_section");
    removeFadedClass("#map_container");
    removeFadedClass(".search_section");
    reassignAltTitleAttribute(".search_button", "Open Search Textbox");
    
    setUserFocus(".search_button");
      
    TEXTBOX_MODE = false;
    INFO_MODE = false;
    MAP_MODE = true;
  }
  
  /////////////////////////////////////////////////////////
  /////////////////// SECTION PROPERTIES ///////////////////
  /////////////////////////////////////////////////////////
  

  // Changes background color of section using CSS.
  function addHighlightedClass(section) {
    $(section).addClass("highlighted");
  }
  
  function removeHighlightedClass(section) {
    $(section).removeClass("highlighted");
  }
  
  // Adds the (display: none) CSS to a section.
  function addHiddenClass(section) {
    $(section).fadeOut(500);
    $(section).addClass("hidden");
  }
  
  function removeHiddenClass(section) {
    $(section).fadeIn(500);
    $(section).removeClass("hidden");
  }
  
  // Changes the color saturation of section using CSS.
  function addFadedClass(section) {
    $(section).fadeTo("slow", 0.2);
  }
  
  function removeFadedClass(section) {
    $(section).fadeTo("slow", 1.0);
  }
  
  // element is a class, altName is a string.
  // Changes the alt and title attributes of an element.
  function reassignAltTitleAttribute(element, altName) {
    $(element).attr("alt", altName);
    $(element).attr("title", altName);
  }
  
  // Changes focus to the element specified. For accessibility purposes.
  function setUserFocus(element) {
    $(element).focus();
  }
  
  $(initializePage)
}
