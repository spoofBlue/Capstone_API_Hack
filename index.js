let MAP;

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
  
  let MAP_MODE = true;
  let TEXTBOX_MODE = false;
  let INFO_MODE = false;
  let USER_INPUT = "";
  let MARKERS = [];
  
  function initializePage() {
    handleClickOnSearchSection();
    handleSearchButton();
    handleExitButton();
    handleEscKeyboardPress();
    handleClickOnMap();
    
    initializeMapCities();
    startIntroMode();
  }  
  
  function startIntroMode() {
    removeHiddenClass(".intro_section");
    removeHiddenClass(".exit_button");
    addHiddenClass(".search_section");
    addFadedClass("#map_container");
    
    setUserFocus(".exit_button");
  }
  
  function handleClickOnSearchSection() {
    $(".search_section").click(function() {
      startTextboxMode();
    });
  }

  function getUserTextboxInput() {
    USER_INPUT = $(".search_textbox").val();
  }
  
  // Change dispalys to show TEXTBOX_MODE and fade map to background.
  //*** Add class="faded untouchable" to (map)
  function startTextboxMode() {
    addHighlightedClass(".search_button");
    removeHiddenClass(".search_textbox");
    removeHiddenClass(".exit_button");
    removeHiddenClass("#map_container");
    addHiddenClass(".info_section");
    removeFadedClass(".search_section");
    addFadedClass("#map_container");
    reassignAltTitleAttribute(".search_button", "Search City");
    
    setUserFocus(".search_textbox");
      
    TEXTBOX_MODE = true;
    MAP_MODE = false;
    INFO_MODE = false;
  }
  
  // If the textbox is already up and has user input inside, clicking the search icon will begin the text-based search for a city.
  function handleSearchButton() {
    $(".search_button").click(function(event) {
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
  
// In TEXTBOX_MODE, On click of 'search icon':
// Search user input in city database of Teleport API
// input could come from text search or map city click.
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
      error : failedSearch
    };
    $.ajax(general_settings);
  }
  
  function failedSearch(error) {
    console.log(`City failed to load.`);
  }
  
  // If processInput(input) is sucessful after user uses search function, this function grabs the first city object from data and will show Teleport/Wikipedia information if available.
  function startInfoMode(data) {
    showAllInfo(data);
    
    addHiddenClass(".search_section");
    addHiddenClass("#map_container");
    removeHighlightedClass(".search_button");
    removeHiddenClass(".info_section");
    
    INFO_MODE = true;
  }
  
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
  
  function verifyTeleportDataNotEmpty(data) {
    return !jQuery.isEmptyObject(data._embedded[`city:search-results`]);
  }
  
  function displayNoSearchResults() {
    $(".info_section").html(`<h1 aria-live="assertive">There is no information for this city in our database.</h1>`);
    removeHiddenClass(".exit_button");
    setUserFocus(`.exit_button`);
  }
  
  // Variable (city) is a collection of very simple data on a specific city. We need more. This function retrieves more detailed info on a city from Teleport's API. Then displays in on the webpage.
  function showTeleportCityInfo(city) {
    const cityDetails = getTeleportCityInfo(city);
    displayBasicInfoContent(cityDetails);
    displayTeleportCityInfo(cityDetails);
    
    setUserFocus(".city_found");
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
  
  function displayBasicInfoContent(cityDetails) {
    $(`.info_section`).append(`
      <div class=info_section_background></div>
      <h1 class="city_found">Results for ${cityDetails[`fullName`]}</h1> 
      <div class="teleport_info"></div>
      <div class="wikipedia_info" aria-live="assertive"></div>
    `);
    removeHiddenClass(".exit_button");
  }
  
  
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
  
  // As I can't make synchronous calls with jsonp files, I can't return statements to this function as originally intended (like showTeleportCityInfo, which has displayTeleportCityInfo). I'll have to move displayWikipediaInfo into a success callback downstream.   
  function showWikipediaInfo(city) {
    getWikipediaEntry(city);
  }
  
  function getWikipediaEntry(city) {
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
    displayWikipediaInfo(cityDetails);
  }
  
  function displayWikipediaInfo(cityDetails) {
    $(`.wikipedia_info`).empty();
    $(`.wikipedia_info`).append(`<h2>The wikipedia summary for ${cityDetails[`name`]}.</h2>`);
    const text = removeHtmlFormatting(cityDetails[`introHtml`]);
    $(`.wikipedia_info`).append(`${text}`);
  }
  
  function removeHtmlFormatting(str) {
    str = str.replace(/<br>/gi, "\n");
    str = str.replace(/<[^p](?:.|\s)*?>/g, "");
    return str;
  }
  
  function handleExitButton() {
    $("main").on("click", ".exit_button", function() {
      exitSection();
    });
  }
  
  function handleEscKeyboardPress() {
    $(document).keyup(function(event) {
      if (event.keyCode === 27) {
       exitSection();
      }
    });
  }
  
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
  
  // Although
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
  
  // Grab all cities from the stored variable TELEPORTCITIES. The for/if statement only allows a fraction of cities to be placed on the map using the equation.  Essentially, the more zoomed in the map is, the more cities that will display.
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
  
  // Gets all cities from INITIALCITIES gets them displayed on map through fuction..
  function showInitialCities() {
    Object.keys(INITIALCITIES).forEach(function(cityName) {
      displayTeleportCity(cityName);
    });
  }
  
  // Clears all markers that aren't the INITIALCITIES markers for now.
  function clearMarkers() {
    let initialCitiesLength = Object.keys(INITIALCITIES).length;
    for (let i = MARKERS.length - 1; i >= initialCitiesLength; i--) {
      MARKERS[i].setMap(null);
      MARKERS.splice(i, 1);
    }
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
        scale: 5
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
  
  function handleClickOnMap() {
    $("#map_container").click(function() {
      startMapMode();
    });
  }
  
  function startMapMode() {
    removeHighlightedClass(".search_button");
    addHiddenClass(".search_textbox");
    addHiddenClass(".info_section");
    addHiddenClass(".exit_button");
    addHiddenClass(".intro_section");
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
  
  function addHighlightedClass(section) {
    $(section).addClass("highlighted");
  }
  
  function removeHighlightedClass(section) {
    $(section).removeClass("highlighted");
  }
  
  function addHiddenClass(section) {
    $(section).fadeOut(500);
    $(section).addClass("hidden");
  }
  
  function removeHiddenClass(section) {
    $(section).fadeIn(500);
    $(section).removeClass("hidden");
  }
  
  function addFadedClass(section) {
    $(section).fadeTo("slow", 0.2);
  }
  
  function removeFadedClass(section) {
    $(section).fadeTo("slow", 1.0);
  }
  
  function reassignAltTitleAttribute(element, altName) {
    $(element).attr("alt", altName);
    $(element).attr("title", altName);
  }
  
  function setUserFocus(element) {
    $(element).focus();
  }
  
$(initializePage)
}
