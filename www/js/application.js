Parse.initialize('CBV56vJgLv8chR4XfRjepzFhTTc88KXdR2xiO5Ic', 'z4ToJJNWGSeYeLh5MIEsJ5bMtOd7R7KMyuYgch0p');
var Post = Parse.Object.extend('Post');
var latitude, longitude;

function findPosts() {
  $.mobile.loading('show');
  $('#refresh').addClass('ui-disabled');
  $('#notice').html('');

  var posts = new Parse.Query(Post);
  var location = new Parse.GeoPoint({
    latitude: latitude, 
    longitude: longitude
  });
  posts.withinMiles('location', location, 1);
  posts.descending('createdAt');
  posts.find({
    success: function(results) {
      console.log('Found ' + results.length + ' posts nearby.');
      if (results.length == 0) {
        $('#notice').append('<p>No posts found nearby.</p>');
      } else {
        var list = $('#posts');
        list.html('');
        for (var i = 0; i < results.length; i++) {
          var post = results[i];
          var createdAt = post.createdAt.toISOString();
          list.append('<li>' + post.get('message') + ' <time class="timeago" datetime="' + createdAt + '">' + createdAt + '</time></li>');
        }
        list.listview('refresh');
        $('time.timeago').timeago();
      }
      $.mobile.loading('hide');
      $('#refresh').removeClass('ui-disabled');
    },
    error: function(error) {
      console.log('Error: ' + error.code + ' ' + error.message);
      $.mobile.loading('hide');
      $('#refresh').removeClass('ui-disabled');
    }
  });
}

function refreshLocation () {
  navigator.geolocation.getCurrentPosition(function(position) {
    latitude = position.coords.latitude;
    longitude = position.coords.longitude;    
    $('#map').css('background', 'url(http://maps.googleapis.com/maps/api/staticmap?center=' + latitude + ',' + longitude + '&zoom=10&size=50x50&maptype=terrain&sensor=true&&key=AIzaSyB8_6TbuII6dN7-I17b6N5v4z38uLQ-1P8) center center no-repeat').css('background-size', 'cover');
    findPosts();
  }, function(error) {
    console.log(error)
  }, {
    maximumAge: 60000, 
    timeout: 5000, 
    enableHighAccuracy: true
  });  
}

$('#refresh').click(function(e) {
  refreshLocation();
  return false;
});

$('#post').submit(function(e) {
  var shout = new Post();
  var message = $('#message');
  var location = new Parse.GeoPoint({
    latitude: latitude, 
    longitude: longitude
  });

  shout.set('location', location);
  shout.set('message', message.val());

  message.blur();

  shout.save(null, {
    success: function(post) {
      message.val('');
      findPosts();
    },
    error: function(post, error) {
      console.log(error);
    }
  });
  return false;
});

$(document).ready(function() {
  refreshLocation();
});

/* Phonegap code */
var app = {
  initialize: function() {
    this.bindEvents();
  }, bindEvents: function() {
    document.addEventListener('deviceready', this.onDeviceReady, false);
  }, onDeviceReady: function() {
    var pushNotification = window.plugins.pushNotification;
    pushNotification.registerDevice({
      alert: true, badge: true, sound: true
    }, function(status) {
      var params = {
        'deviceType': 'ios',
        'deviceToken': status.deviceToken,
        'channels': ['']
      };
      $.ajax({
        type: "POST",
        url: 'https://api.parse.com/1/installations',
        beforeSend: function(xhr) {
          xhr.setRequestHeader('X-Parse-Application-Id', 'CBV56vJgLv8chR4XfRjepzFhTTc88KXdR2xiO5Ic');
          xhr.setRequestHeader('X-Parse-REST-API-Key', 'piFbaPMnFN66Ah2gs3Y6MrmSQRsxFNDtKNurT70y');
          xhr.setRequestHeader('Content-Type', 'application/json');
        },
        data: JSON.stringify(params),
        success: function() {
          console.log('Device registered for push notifications.')
        },
        error: function(e) {
          console.log('Registration for push notifications failed.')
        },
        dataType: 'application/json'
      });
		});
    app.receivedEvent('deviceready');
  }, receivedEvent: function(id) {
    console.log('Received Event: ' + id);
  }
};

app.initialize();

