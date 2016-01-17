/*
 * Strava Fahrenheit Celsius conversion
 * This Chrome extension will convert the temperatures shown to the user from Fahrenheit to Celsius.
 * The extension uses:
 *     - jQuery (https://jquery.com/) - To select elements on the page and manipulate them
 *     - jQuery Observe (https://github.com/kapetan/jquery-observe): To simplify the process of using DOM mutation observer to watch for changes in the page
 *
 * THIS EXTENSION IS NOT BUILT, ENDORSED OR PROBABLY EVEN KNOWN ABOUT BY STRAVA.
 * FOR ANY QUESTIONS, COMMENTS OR QUERIES PLEASE CONTACT THE DEVELOPER, NOT STRAVA.
 * IT WAS MADE BY A USER AND FAN OF THE SITE WHO SIMPLY DOESN'T GET FAHRENHEIT.
 *
 * This plugin was writen by Philip Garner - http://www.philipgarner.co.uk
*/


//Temperatures stored globally to compare against previous conversions
var currentTempInC;
var currentMaxTempInC;
var currentAvgTempInC;
var maxTemp;
var avgTemp;
var graphMinTemp;
var graphMaxTemp;
var graphsConverted = false;
	
$(document).ready(function(){
	
	//Listen for changes to the view. When you click between overview/analysis you're not actually reloading the page so the extension will not automatically reload - we have to do it manually.
	$('#view').observe('added', 'g.chartGroup', function(record) {
		changeTempUnit();
	});
	
	//Change the units on the initial page load
	changeTempUnit();
	
	//Add a subtle note to the page referencing the extension
	$('.copyright').append(chrome.i18n.getMessage("copyright"));

	
})

function changeTempUnit(){
	console.log('Changing temps');
	/** FOR THE OVERVIEW **/
	//Get the average temp element
	var tempElement = $(".more-stats th:contains('" + chrome.i18n.getMessage("temperature") + "')").parent().children('td');
	
	//Read the temperature (i.e. chop off the F)
	var averageTemp = tempElement.text();
	//Check to see if we've already changed the temp on the overview page
	if(averageTemp.indexOf("\u2103") < 0){
		averageTemp = averageTemp.substring(0, averageTemp.length-1);
		
		//Change the value from F to C.
		tempElement.html(fahrenheitToCelsius(averageTemp) + "&#8451;")
	}
	
	/** END OF OVERVIEW **/
	
	/** FOR ANALYSIS **/
	//The key on the left hand side of the graph - look for the word "temperature"
	var chartKey = $("#stacked-chart g.labelGroup g.label-box text:contains('" + chrome.i18n.getMessage("temperature") + "')").parent();
	//Once found the word temperature we can find the average and max temps for the graph - these change as the user interacts with the graph
	maxTemp = $('text:nth-of-type(2)', chartKey);
	avgTemp = $('text:nth-of-type(3)', chartKey);
	//We can also find the Y-axis labels - these do not change
	var graphMax = $('text:nth-of-type(4)', chartKey);
	var graphMin = $('text:nth-of-type(5)', chartKey);
	//Count the index of the key on the left hand side - used to find the corresponding number on the right side
	var tempPosition = chartKey.index() + 1;
	//Find the current temperature - the number represented by the cursor position on the graph
	var currentTemp = $("#stacked-chart g.listenerGroup g:nth-of-type(" + tempPosition + ") text.static-info-box.value");
	//Find the symbol below the number
	var currentTempSymbol = $("#stacked-chart g.listenerGroup g:nth-of-type(" + tempPosition + ") text.static-info-box.bottom");
	
	//Change the graph Y-axis labels to be in C. First make sure they haven't already been converted and they are actually shown (i.e. we're not on the Overview screen)
	if(!graphsConverted && graphMin.length){
		graphMinTemp = fahrenheitToCelsius(graphMin.text());
		graphMaxTemp = fahrenheitToCelsius(graphMax.text());
		graphsConverted = true;
	}
	
	//Display the graph Y-Axis labels - these never change so there is no need to listen for changes
	graphMin.html(graphMinTemp);
	graphMax.html(graphMaxTemp);
	
	//Change the symbol on the right of the graph
	currentTempSymbol.html("&#8451;")
	//Update the max and averages for the starting state of the graph
	updateMax();
	updateAvg();
	
	//Listen for changes to the current temp (the one that shows the temp at the cursor position for the graph)
	currentTemp.observe('childList', function(record) {
		//Get the current temperature
		var currentTempText = currentTemp.text();
		//To avoid converting a temp that is already in C then make sure the temperature displayed is not the same as the previous conversion
		//This avoids erroneous conversions started by very small mouse movements
		if(currentTempText !== '--' && currentTempText != currentTempInC){
			//Covert the temperature
			currentTempInC = fahrenheitToCelsius(currentTempText);
			currentTemp.html(currentTempInC);
		}
    });
	
	//Listen for changes to the maximum temperature (on the LHS of the graph)
	maxTemp.observe('childList', function(record) {
		updateMax();
	});
	
	//Listen for changes to the average temperature (on the LHS of the graph)
	avgTemp.observe('childList', function(record) {
		updateAvg();
	});
	
	
	/** END OF ANALYSIS **/
}

//Updates the maximum temperature on the LHS of the graph
//Called on page load and every time the graph changes
function updateMax(){
	//Get the current temp
	var currentMaxTemp = maxTemp.text();
	//Chop off the word "Max"
	currentMaxTemp = currentMaxTemp.substring(chrome.i18n.getMessage("max").length+1,currentMaxTemp.length);
	//Make sure we're not doing the conversion on something already in C
	if(currentMaxTemp != currentMaxTempInC){
		//Apply the conversion
		currentMaxTempInC = fahrenheitToCelsius(currentMaxTemp);
		maxTemp.html(chrome.i18n.getMessage("max") + ' ' + currentMaxTempInC)
	}
}

//Updates the average temperature on the LHS of the graph
//Called on page load and every time the graph changes
function updateAvg(){
	//Get the current temp
	var currentAvgTemp = avgTemp.text();
	//Chop off the word "Avg"
	currentAvgTemp = currentAvgTemp.substring(chrome.i18n.getMessage("avg").length+1,currentAvgTemp.length);
	//Make sure we're not doing the conversion on something already in C
	if(currentAvgTemp != currentAvgTempInC){
		//Apply the conversion
		currentAvgTempInC = fahrenheitToCelsius(currentAvgTemp);
		avgTemp.html(chrome.i18n.getMessage("avg") + ' ' + currentAvgTempInC)
	}
}

//Converts a temperature from F to C
function fahrenheitToCelsius(f){
	var c = (f - 32) * 5 / 9;
	return (Math.round(c*10))/10;
}
