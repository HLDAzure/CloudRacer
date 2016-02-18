var app = angular.module('CloudRacerApp', ['btford.socket-io', 'zingchart-angularjs']);
var raceDuration = 30000; //ms

app.factory('mySocket', function (socketFactory) {
  var myIoSocket = io.connect('localhost:8888');
  var mySocket = socketFactory({
    ioSocket: myIoSocket
  });
  mySocket.forward('error');
  return mySocket;
});

app.controller('CloudRacerLeaderboardController', function() {
    this.distance = {
      value: 1,
      playerName: "Bob"
    }

    this.speed = {
      value: 30,
      playerName: "Jill"
    }
    
  }); 

app.controller('CloudRacerLiveRaceController', function($scope, mySocket) {
    var race = this;
    var graphUpdateInterval = 100;

    race.thisRaceData = [];
    race.rpmValues = [];
    race.hrValues = [];
    race.distanceValues = [];
    race.raceChartJson = {
        type : 'area',
        plot :      { aspect:"spline" }, 
        'scale-x': {
            'min-value': 0,
            'max-value': raceDuration,
            step: 5000,
            'guide': {
                "line-width":"2px",
                "line-color":"red",
                "line-style":"solid",
                "alpha":0.5
            }
        },
        'scale-y': {
            'min-value': 0,
            'max-value': 120
        },
        series :    [
        { 
                text: 'RPM',
                values : race.rpmValues, 
                marker: { visible: 0 }
                },
        { 
                text: 'Distance',
                values : race.distanceValues,
                marker: { visible: 0 }
                },
        { 
                text: 'Heart Rate',
                values : race.hrValues,
                marker: { visible: 0 }
                }
        ]
    };
    
    race.rpmGaugeJson = {
        "type":"gauge", 
        "scale-r":{
            "aperture":300,     //Specify your scale range.
            "values":"0:120:10" //Provide min/max/step scale values.
        },
        "title": {
            "text":"RPM"
            },
        "series":[
            {"values":[0]}
        ]
    };
    
    race.timeGaugeJson = {
        "type":"gauge", 
        "scale-r":{
            "aperture":360,     //Specify your scale range.
            "values":"0:60000:5000" //Provide min/max/step scale values.
        },
        "title": {
            "text":"Time"
            },
        "series":[
            {"values":[0]}
        ]
    };
    
    race.hrGaugeJson = {
        "type":"gauge", 
        "scale-r":{
            "aperture":300,     //Specify your scale range.
            "values":"60:220:10" //Provide min/max/step scale values.
        },
        "title": {
            "text":"Heart Rate"
            },
        "series":[
            {"values":[0]}
        ]
    };

    var momStart;
    var nextUpdateTime;
    mySocket.on('playerdata', function(data) {
        race.livestats = data;
    });
    
    mySocket.on('liveRaceData', function(data) {
        momStart = momStart || moment(data.startTime);
        nextUpdateTime = nextUpdateTime || moment();
        var momentCur = moment(data.readingTime);
        data.elapsedTime = momentCur.diff(momStart);
        race.thisRaceData.push(data);
        if (moment().diff(nextUpdateTime) >= 0) {  // time to update the graph?
            console.log(data.bpm);
            race.rpmValues.push([data.elapsedTime,data.rpm]);
            race.distanceValues.push([data.elapsedTime,data.distance]);
            race.hrValues.push([data.elapsedTime,data.bpm]);            
            race.rpmGaugeJson.series[0].values = [data.rpm];   
            race.timeGaugeJson.series[0].values = [data.elapsedTime];
            race.hrGaugeJson.series[0].values = [data.bpm];
            nextUpdateTime = nextUpdateTime.add(graphUpdateInterval, 'ms'); // set next update time
        }
        else
        {
           
        }
    });
  
    race.startrace = function() {
        race.thisRaceData = [];
        race.distanceValues.length = 0;
        race.rpmValues.length = 0;
        race.hrValues.length = 0;
        console.log(this.playerName);
        mySocket.emit('start', { "playerName": this.playerName});
    };
    race.sendBandData = function() {
        mySocket.emit('banddata', '{ "bpm": 5 }');
    };
    
});