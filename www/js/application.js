var parseApplicationId = 'CBV56vJgLv8chR4XfRjepzFhTTc88KXdR2xiO5Ic';
var parseRestApiKey = 'piFbaPMnFN66Ah2gs3Y6MrmSQRsxFNDtKNurT70y';
var parseJavascriptApiKey = 'z4ToJJNWGSeYeLh5MIEsJ5bMtOd7R7KMyuYgch0p';

Parse.initialize(parseApplicationId, parseJavascriptApiKey);
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
  posts.withinMiles('location', location, 1.0);
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
      $('#refresh').removeClass('ui-disabled');
      $.mobile.loading('hide');
    },
    error: function(error) {
      console.log('Error: ' + error.code + ' ' + error.message);
      $.mobile.loading('hide');
      $('#refresh').removeClass('ui-disabled');
    }
  });
}

// setTimeout('findPosts()', 15000);

function updateInstallation() {
  // update the installation with the last known location for the 'user'  
  var params = {
    'location': {
      '__type': 'GeoPoint',
      'latitude': latitude,
      'longitude': longitude
    }
  };
  $.ajax({
    type: "PUT",
    url: 'https://api.parse.com/1/installations/' + window.localStorage.getItem('installationId'),
    beforeSend: function(xhr) {
      xhr.setRequestHeader('X-Parse-Application-Id', parseApplicationId);
      xhr.setRequestHeader('X-Parse-REST-API-Key', parseRestApiKey);
      xhr.setRequestHeader('Content-Type', 'application/json');
    },
    data: JSON.stringify(params),
    success: function() {
      console.log('Location for installation updated.')
    },
    error: function() {
      console.log('Location update for installation failed.')
    },
    dataType: 'json'
  });
}

function refreshLocation () {
  navigator.geolocation.getCurrentPosition(function(position) {
    latitude = position.coords.latitude;
    longitude = position.coords.longitude;    
    $('#map').css('background', 'url(http://maps.googleapis.com/maps/api/staticmap?center=' + latitude + ',' + longitude + '&zoom=10&size=50x50&maptype=terrain&sensor=true&&key=AIzaSyB8_6TbuII6dN7-I17b6N5v4z38uLQ-1P8) center center no-repeat').css('background-size', 'cover');
    findPosts();
    if (window.device) {
      updateInstallation();
    }
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
  $.mobile.loading('show');

  var message = $('#message');
  message.blur();

  var shout = new Post();
  var location = new Parse.GeoPoint({
    latitude: latitude, 
    longitude: longitude
  });

  shout.set('location', location);
  shout.set('message', message.val());

  shout.save(null, {
    success: function(post) {
      message.val('');
      findPosts();
    },
    error: function(post, error) {
      console.log(error);
      $.mobile.loading('hide');
    }
  });
  return false;
});

// phonegap code for push notifications
function registerForPushNotifications() {
  // todo: don't do this if we already have an installationId? or do we have to retry?
  var pushNotification = window.plugins.pushNotification;
  pushNotification.setApplicationIconBadgeNumber(0);
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
        xhr.setRequestHeader('X-Parse-Application-Id', parseApplicationId);
        xhr.setRequestHeader('X-Parse-REST-API-Key', parseRestApiKey);
        xhr.setRequestHeader('Content-Type', 'application/json');
      },
      data: JSON.stringify(params),
      success: function(installation) {
        window.localStorage.setItem('installationId', installation.objectId);
        console.log('Installation registered for push notifications.');
      },
      error: function(installation) {
        // todo: can we remove this or do we might still want to get back the installationId in some cases?
        window.localStorage.setItem('installationId', installation.objectId);
        console.log('Registration for push notifications failed.');
      },
      dataType: 'json'
    });
  });
}

$(document).ready(function() {
  // from device
  if (window.device) {
    document.addEventListener('deviceready', onDeviceReady, false);
    function onDeviceReady() {
      registerForPushNotifications();
      refreshLocation();
    }
  }
  // from browser
  else {
    refreshLocation();
  }
});