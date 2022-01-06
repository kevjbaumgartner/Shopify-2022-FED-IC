// Flags
var state = 0; // 0 - active browsing, 1 - viewing modal

// Arrays
var apiData = null;
var imageArray = [];
var likedArray = [];

// User input
var imageRover;
var imageSol;
var imagePage;

// Definitions
const apiKey = //redacted;

// roverImage object constructor
function roverImage(rover, sol, page, id, src, camera, ed){
	this.rover = rover;
	this.sol = sol;
	this.page = page;
	this.id = id;
	this.src = src;
	this.camera = camera;
	this.ed = ed;
}

// Pulls images from the API and places them into an array,
// fades out to white until the API successfully returns with images OR empty
function getImages(){

	// User input field sanitizing,
	// alert if empty or NaN
	if($("#solSelect").val() == "" || $("#solSelect").val().match(/^[0-9]+$/) == null){
		requiredAlert("sol");
	}
	if($("#pageSelect").val() == "" || $("#pageSelect").val().match(/^[0-9]+$/) == null){
		requiredAlert("page")
	}
	else if(($("#solSelect").val() != "") && ($("#pageSelect").val() != "") && ($("#solSelect").val().match(/^[0-9]+$/) != null) && ($("#pageSelect").val().match(/^[0-9]+$/) != null)){
		fadeOut(); // See fadeOut function

		// Get input values from search fields
		imageRover = $("#roverSelect").find(":selected").val();
		imageSol = $("#solSelect").val();
		imagePage = $("#pageSelect").val();

		if(imageSol != "" && imagePage != ""){

			// Prepared statement
			var apiRequest = new XMLHttpRequest();
			var queryString = "https://api.nasa.gov/mars-photos/api/v1/rovers/" + imageRover + "/photos?sol=" + imageSol + "&page=" + imagePage + "&api_key=" + apiKey;

			apiRequest.open("GET", queryString, true);
			apiRequest.onload = function(){

				// Reset image tiles and image array
				imageArray = [];
				$("#tiles").html("");

				// Parse JSON from API to client sided array,
				apiData = JSON.parse(this.response);
				if(((apiRequest.status >= 200) && (apiRequest.status < 400)) && ((apiData["photos"] != undefined))){
					if(apiData["photos"].length < 1){
						$("#tiles").html("No images found for that search criteria. Please try again.<br><br>:^(");
					}
					else{

						// If images are found, pass JSON data through imageRover constructor and store
						for(var i = 0; i < apiData["photos"].length; i++){
							fillArray(i);
							createTile(i);
						}
						restoreLikes(); // See restoreLikes function
					}
					fadeIn(); // See fadeIn function
				}
			}
			apiRequest.send();
		}
		else{
			
		}
	}
}

// Gathers relevant information from the API JSON array,
// creates roverImage objects and fills them into a new array
function fillArray(index){
	var image = new roverImage(
		(apiData["photos"][index].rover.name).toLowerCase(),
		apiData["photos"][index].sol,
		imagePage,
		apiData["photos"][index].id,
		apiData["photos"][index].img_src,
		apiData["photos"][index].camera,
		apiData["photos"][index].earth_date
		);
	imageArray.push(image);
}

// Dynamically creates tile elements using a roverImage object
function createTile(index){
	$("#tiles").append("<div ir='" + imageArray.indexOf(imageArray[index]) + "' rover='" + imageArray[index].rover + "' sol='" + imageArray[index].sol + "' id='" + imageArray[index].id + "' page='" + imageArray[index].page + "' src='" + imageArray[index].src + "' class='tile' style='background-image: url(" + imageArray[index].src + ")'><div class='tileHover'></div><p class='tileIcon'><i class='far fa-heart'></i><p class='tileText'>" + capitalize(imageArray[index].rover) + ": " + imageArray[index].camera.name + " - " + imageArray[index].id + "<br>" + imageArray[index].ed + "</p></div>");
}

// Parses the stored likedArray localStorage item if they exist,
// fills existing items back into likedArray
function getLikedArray(){
	if(localStorage.getItem("likedArray") === null){

	}
	else{
		tempArray = JSON.parse(localStorage.getItem("likedArray"));
		for(var i = 0; i < tempArray.length; i++){
			var obj = Object.assign(new roverImage, tempArray[i]);
			likedArray.push(obj);
		}
	}
}

// Restore localStorage saved likes once the current instance of tiles is rendered
function restoreLikes(){
	for(var i = 0; i < likedArray.length; i++){
		var id = likedArray[i].id;
		var tileIcon = $(".tile[id = '" + id + "']").children(".tileIcon");
		tileIcon.addClass("liked");
		tileIcon.html("<i class='fas fa-heart'>");
	}
}

// Smooth UI transition to white
function fadeOut(){
	$("#fade").css("opacity", 1);
}

// Smooth UI transition back to elements
function fadeIn(){
	setTimeout(function(){
		$("#fade").css("opacity", 0);
		$("#header").css("position", "unset");
		$("#header").css("height", "20vh");
	}, 300);
}

// Quick red flash animation on text input fields
function requiredAlert(str){
	$("#" + str + "Select").css("box-shadow", "0px 0px 0px 1px rgba(214, 15, 58, 0.8)");
	setTimeout(function(){
		$("#" + str + "Select").css("box-shadow", "none");
	}, 500);	
}

// Show modal, enable interactivity, and populate fields with roverImage drawn info
function openModal(image){
	state = 1;
	$("#modal").css("opacity", 1);
	$("#modal").css("pointer-events", "all");
	$("#modalHeader").html(capitalize(image.rover) + ": " + image.camera.full_name + " - " + image.id);
	$("#modalImage").attr("src", image.src);
	$("#modalDetails").html("Solar days: " + image.sol + "<br>Page: " + image.page + "<br>Earth date taken: " + image.ed);
}

// Hide modal, disable interactivity
function closeModal(){
	state = 0;
	$("#modal").css("opacity", 0);
	$("#modal").css("pointer-events", "none");
}

// Capitalizes the first letter of a string
function capitalize(str){
	return str.charAt(0).toUpperCase() + str.slice(1);
}

// Tile like and unlike functionality
$(document).on("click", ".tileIcon", function(){
	var image = imageArray[$(this).parent().attr("ir")];

	// Upon clicking the heart tileIcon:
	// If the image is already liked, remove the liked image from the likedArray
	// Otherwise, add it to the likedArray
	// Regardless, push the likedArray immediately to localStorage
	if($(this).hasClass("liked")){
		var index = 0;
		for(var i = 0; i < likedArray.length; i++){
			if(image.id == likedArray[i].id){
				index = i;
				break;
			}
		}
		likedArray.splice(index, 1);
		$(this).removeClass("liked");
		$(this).html("<i class='far fa-heart'>");
		localStorage.setItem("likedArray", JSON.stringify(likedArray));
	}
	else{
		likedArray.push(image);
		$(this).addClass("liked");
		$(this).html("<i class='fas fa-heart'>");
		localStorage.setItem("likedArray", JSON.stringify(likedArray));
	}
});

// Modal view functionality,
// populates the modal with the selected tiles roverImage info
$(document).on("click", ".tileHover", function(){
	var image = imageArray[$(this).parent().attr("ir")];
	openModal(image);
});

// Modal view close on pressing outside of the modal body
$(document).on("click", "#modalBackground", function(){
	if(state == 1){
		closeModal();
	}
});

// Keystroke event listeners
$(document).keyup(function(event){

	// If the viewer is NOT viewing a modal and presses ENTER,
	// search using the current input field criteria
	if((event.which === 13) && (state == 0)){
		getImages();
	}

	// If the viewer IS viewing a model and presses ESC,
	// close the modal
	if((event.which === 27) && (state == 1)){
		closeModal();
	}
});

// Repopulate likedArray from localStorage
$(document).ready(function(){
	getLikedArray();
});
