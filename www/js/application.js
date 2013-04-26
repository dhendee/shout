var parseApplicationId = 'CBV56vJgLv8chR4XfRjepzFhTTc88KXdR2xiO5Ic';
var parseRestApiKey = 'piFbaPMnFN66Ah2gs3Y6MrmSQRsxFNDtKNurT70y';
var parseJavascriptApiKey = 'z4ToJJNWGSeYeLh5MIEsJ5bMtOd7R7KMyuYgch0p';

Parse.initialize(parseApplicationId, parseJavascriptApiKey);
var Post = Parse.Object.extend('Post');
var latitude, longitude;

function findPosts() {
  $('#refresh').addClass('ui-disabled');
  $('#notice').html('');

  var posts = new Parse.Query(Post);
  var location = new Parse.GeoPoint({
    latitude: latitude, 
    longitude: longitude
  });
  
  posts.withinMiles('location', location, 1.0);
  posts.limit(100);
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
          list.append('<li ' + 'class="' + post.get('type') + '"><span class="message">' + post.get('message') + ' </span><time class="timeago" datetime="' + createdAt + '">' + createdAt + '</time></li>');
        }
        list.listview('refresh');
        $('time.timeago').timeago();
      }
      $('#refresh').removeClass('ui-disabled');
      $.mobile.loading('hide');
    },
    error: function(error) {
      alert('Error: ' + error.code + ' ' + error.message);
      $.mobile.loading('hide');
      $('#refresh').removeClass('ui-disabled');
    }
  });
}

function updateInstallation() {
  // update the installation with the last known location and local date for the 'user'  
  var today = new Date();
  var params = {
    'location': {
      '__type': 'GeoPoint',
      'latitude': latitude,
      'longitude': longitude
    },
    'localUpdatedAt': today
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
    success: function(installation) {
      console.log('Location for installation updated.');
    },
    error: function(installation, error) {
      alert('Location update for installation failed.');
    },
    dataType: 'json'
  });
}

function refreshLocation () {
  navigator.geolocation.getCurrentPosition(function(position) {
    latitude = position.coords.latitude;
    longitude = position.coords.longitude;    
    $('#refresh').css('background', 'url(http://maps.googleapis.com/maps/api/staticmap?center=' + latitude + ',' + longitude + '&zoom=10&size=50x50&maptype=terrain&sensor=true&&key=AIzaSyB8_6TbuII6dN7-I17b6N5v4z38uLQ-1P8) center center no-repeat').css('background-size', 'cover');
    findPosts();
    if (window.phonegap) {
      updateInstallation();
    }
  }, function(error) {
    alert('Failed to update location for device.');
  }, {
    maximumAge: 60000, 
    timeout: 5000, 
    enableHighAccuracy: true
  });  
}

$('#refresh').click(function(e) {
  $.mobile.loading('show');
  refreshLocation();
  findPosts();
  return false;
});

$('form#post').submit(function(e) {
  $('#submit').addClass('ui-disabled');
  $.mobile.loading('show');

  var shout = new Post();

  shout.set('installationId', window.localStorage.getItem('installationId'));

  var location = new Parse.GeoPoint({
    latitude: latitude, 
    longitude: longitude
  });
  
  shout.set('location', location);

  var form = $(this);
  var message = $('#message', form);
  var type = $('#type', form);

  shout.set('message', message.val());
  shout.set('type', type.val());

  shout.save(null, {
    success: function(post) {
      message.val('');
      findPosts();
      $.mobile.changePage('#index', { 
        transition: 'slideup',
        reverse: true
      });
      $('#submit').removeClass('ui-disabled');
    },
    error: function(post, response) {
      alert(response.message);
      $.mobile.loading('hide');
      $('#submit').removeClass('ui-disabled');
    }
  });
  return false;
});

$('#submit').click(function() {
  $('form#post').submit();
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
        storeInstallation(installation);
        console.log('Installation registered for push notifications.');
      },
      error: function(installation, error) {
        // todo: can we remove this or do we might still want to get back the installationId in some cases?
        storeInstallation(installation);
        console.log('Registration for push notifications failed.');
      },
      dataType: 'json'
    });
  });
  document.addEventListener('push-notification', function(event) {
    findPosts();
    pushNotification.setApplicationIconBadgeNumber(0);
  });
}

function storeInstallation(installation) {
  window.localStorage.setItem('installationId', installation.objectId);
}

function setupPostPage() {
  $(document).delegate('#post-shout', 'pageshow', function(event, ui) {
    $('#message', 'form#post').focus();
  });  
  $(document).delegate('#post-shout', 'pagehide', function(event, ui) {
    $('#message', 'form#post').blur();
  });  
}

$(function() {
  window.phonegap = document.URL.indexOf('http://') == -1;
  $.mobile.loading('show');
  if (window.phonegap) {
    document.addEventListener('deviceready', function onDeviceReady() {
      registerForPushNotifications();
      refreshLocation();
      setupPostPage();
    });
    document.addEventListener('resume', function onResume() {
      refreshLocation();
    });    
  } else {
    refreshLocation();
    setupPostPage();
  }
});