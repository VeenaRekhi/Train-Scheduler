// JQuery starts here----

  // Initialize Firebase
  var config = {
    apiKey: "AIzaSyCPOLSFWkh3NDBtwyBZzOlKuleHlxm9ms0",
    authDomain: "train-scheduler-80644.firebaseapp.com",
    databaseURL: "https://train-scheduler-80644.firebaseio.com",
    storageBucket: "train-scheduler-80644.appspot.com",
    messagingSenderId: "826435637730"
  };
  firebase.initializeApp(config);


// Create a variable to reference the database.

  var database = firebase.database();
  var ref = firebase.database().ref();

//Variables for next arriving train
  var nextArrival;
  var nextArrivingTrain;
  
//Flag for update in progress so that we halt the timer and indicate update in firebase
  var updateInProgress = false;
//Location of update in the firebase database
  var updateKey;
  
//Timer to refresh data on the page every one minute
  var myTimer = setInterval(refreshData, 60000);
  refreshData();

// Capture Button Click,

  $('#add-train').on('click', function(event) {
  var trainName = $("#name").val().trim();

// Initial Values
  var destination = $("#destination").val().trim();
  var firstTrainTime = $("#time").val().trim();
  var frequency = $("#frequency").val().trim();

	var ObjTrain = {
		  name: trainName,
    	destination: destination,
      firstTrainTime: firstTrainTime,
      frequency: frequency
	}
    
    event.preventDefault();

//adding the objTrain to the dataBase   
//If we are in update mode, update existing row in firebase
    if (updateInProgress == true) {
      var update = {};
      update['//' + updateKey] = ObjTrain;
      database.ref().update(update);
      updateInProgress = false;
      //Restart the timer once the update is complete
      var myTimer = setInterval(refreshData, 60000);
    }
    else {
      //Add a new row in firebase
      database.ref().push(ObjTrain);
    }
    refreshData();

});


//Refresh the data on HTML page from firebase
function refreshData() {

database.ref().once('value',function(snapshot){

  var nextArrivingTime = 10000;

  console.log(snapshot.val());
  var i = 1;
  var tableHTML = "";
//Iterate through the firebase database for each child
  snapshot.forEach(function(childSnapshot) {
    //Build the HTML table
    tableHTML += "<tr id='" + i + "'>";
    tableHTML += "<td>" + childSnapshot.val().name + "</td>";
    tableHTML += "<td>" + childSnapshot.val().destination + "</td>";
    tableHTML += "<td>" + childSnapshot.val().frequency + "</td>";
    
    // First Time (pushed back 1 year to make sure it comes before current time)
    var startTime = moment(childSnapshot.val().firstTrainTime, "hh:mm").subtract(1, "years");

    //Difference between the times
    var diffTime = moment().diff(moment(startTime), "minutes");
    //Time apart remainder
    var tRemainder = diffTime % childSnapshot.val().frequency;
    
    //Minutes until Train
    var tMinutesTillTrain = childSnapshot.val().frequency - tRemainder;

    //Next Train
    var nextTrain = moment().add(tMinutesTillTrain, "minutes");

    //Check if the current row is the first arriving train
    if (tMinutesTillTrain < nextArrivingTime) {
      nextArrivingTime = tMinutesTillTrain;
      nextArrival = moment(nextTrain).format("hh:mm");
      nextArrivingTrain = childSnapshot.val().name;
    }


    tableHTML += "<td>" + moment(nextTrain).format("hh:mm") + "</td>";
    tableHTML += "<td>" + tMinutesTillTrain + "</td>";
    tableHTML += "<td> <input type='checkbox' id='updChkBox'> </td>";
    tableHTML += "<td> <input type='checkbox' id='remChkBox'> </td>";

    $("#trainForm > tbody").html(tableHTML);
    i++;
  });

$("#nextArrival").html("<br>" + nextArrivingTime);
$("#arrivingTrainName").html("<br>" + nextArrivingTrain);
$("#nextArrivalTime").html("<br>" + nextArrival);

$("#nextArrival1").html("<br>" + nextArrivingTime);
$("#arrivingTrainName1").html("<br>" + nextArrivingTrain);
$("#nextArrivalTime1").html("<br>" + nextArrival);

});

} 

//===================================================================================================================
// This part of the assignment is little bit difficult to understand since "Firebase" is
// comparitively easier for people who use it everyday, not for a new user like me!! definitely needs practise!!
//================================================================================================================== 

//Update the record for item checked withupdate checkbox
$(".btn-upDate").on('click', function(event) {
  var table = document.getElementById("trainForm");
  var rowCount = table.rows.length;
  
  //Iterate through the HTML table looking for row that has the update checkbox checked
  for (var i=1 ; i<rowCount; i++) {
    var row = table.rows[i];
    var chkbox = row.cells[5].childNodes[1];
//Found the row? 
    if (chkbox != null  && chkbox.checked == true) {
      //Set update flag to true
      updateInProgress = true;
      //Stop the timer till the user is done with update so that it doesn't acidentally refresh the page with old values
      clearInterval(myTimer);
      //Take the current table values into the input fields
      var tName = $(row.cells[0]).html();
      $("#name").val(tName);
      var html = $(row.cells[1]).html();
      $("#destination").val(html);
      html = $(row.cells[2]).html();
      $("#frequency").val(html);

// Find the row in firebase database and store the key for update later
    database.ref().once('value',function(snapshot){
      snapshot.forEach(function(childSnapshot) {
        if (childSnapshot.val().name == tName) {
          $("#time").val(childSnapshot.val().firstTrainTime);
          updateKey = childSnapshot.key;
          console.log(updateKey);
        }

      });
    });

    }

  }

});
// Adding the function for removing the object-data from the firebase.

$(".btn-remove").on('click', function(event) {
  var table = document.getElementById("trainForm");
  var rowCount = table.rows.length;
  
  //Iterate through the HTML table looking for row that has the update checkbox checked
  for (var i=1 ; i<rowCount; i++) {
    var row = table.rows[i];
    var chkbox = row.cells[6].childNodes[1];
//Found the row? 
    if (chkbox != null  && chkbox.checked == true) {
      var tName = $(row.cells[0]).html();

// Find the row in firebase database and store the key for update later
      database.ref().once('value',function(snapshot){
        snapshot.forEach(function(childSnapshot) {
          if (childSnapshot.val().name == tName) {
            updateKey = childSnapshot.key;
              var ObjTrain = {
                name: null,
                destination: null,
                firstTrainTime: null,
                frequency: null
              }
// Rtrieving the object key from the firebase.
            var update = {};
            update['//' + updateKey] = ObjTrain;
            database.ref().update(update);
        }

        });
      });
    }
  }  // Setting a small interval for refreshing the data in firebase!
  var myWait = setTimeout(refreshData, 1000);
});
