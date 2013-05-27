var parseApplicationId = 'CBV56vJgLv8chR4XfRjepzFhTTc88KXdR2xiO5Ic';
var parseRestApiKey = 'piFbaPMnFN66Ah2gs3Y6MrmSQRsxFNDtKNurT70y';
var parseJavascriptApiKey = 'z4ToJJNWGSeYeLh5MIEsJ5bMtOd7R7KMyuYgch0p';

Parse.initialize(parseApplicationId, parseJavascriptApiKey);
var Post = Parse.Object.extend('Post');
var latitude, longitude;

function clearData() {
  localStorage.removeItem('username');
  localStorage.removeItem('password');
  localStorage.removeItem('installationId');
  Parse.User.logOut();
}

function findPosts() {
  $('#refresh').addClass('loading');
  $('#notice').html('');

  var location = new Parse.GeoPoint({
    latitude: latitude, 
    longitude: longitude
  });

  var worldPosts = new Parse.Query(Post);
  worldPosts.equalTo('distance', '1000');

  var statePosts = new Parse.Query(Post);
  statePosts.equalTo('distance', '100');

  var cityPosts = new Parse.Query(Post);
  cityPosts.equalTo('distance', '10');
  cityPosts.withinMiles('location', location, 10);

  var neighborhoodPosts = new Parse.Query(Post);
  neighborhoodPosts.equalTo('distance', '1');
  neighborhoodPosts.withinMiles('location', location, 1);

  var posts = Parse.Query.or(worldPosts, statePosts, cityPosts, neighborhoodPosts);
  posts.limit(100);
  posts.descending('createdAt');

  posts.find({
    success: function(results) {
      console.log('Found ' + results.length + ' posts nearby.');
      if (results.length == 0) {
        $('#notice').append('<p>No shouts found nearby.</p>');
      } else {
        var list = $('#posts');
        list.html('');
        for (var i = 0; i < results.length; i++) {
          var post = results[i];
          var createdAt = post.createdAt.toISOString();
          var distance;
          switch (post.get('distance')) {
            case '1':
              distance = 'within &frac14; mile';
              break;
            case '10':
              distance = 'within 1 mile';
              break;
            case '100':
              distance = 'within 500 miles';
              break;
            default:
              distance = 'somewhere in the world';
          }
          // todo: placeholder image for failed image saves?
          var image = post.get('image') ? post.get('image').url : '';
          list.append('<li data-image="' + image + '"><span class="message">' + post.get('message') + ' </span><small><time class="timeago" datetime="' + createdAt + '">' + createdAt + '</time>, ' + distance +  '</small></li>');
        }
        list.find('.action').fastClick(function() {
          var item = $(this);
          var shareContent = $('#share-content');
          shareContent.html($('.message', item).html());
          shareContent.data('image', item.data('image'));
          $('#share, #modal-background').show();
        });
        $('time.timeago').timeago();
      }
      $('#refresh').removeClass('loading');
    },
    error: function(error) {
      alert('Error finding posts: ' + error.code + ' ' + error.message);
      $('#refresh').removeClass('loading');
    }
  });
}

$('#message').fastClick(function() {
  $('#post-content').addClass('open');
});

$('#distance').on('change', function() {
  $('#message').trigger('focus');
});

$('#posts-content, #header, #refresh, #points').on('click', function() {
  $('#post-content').removeClass('open');
});  

$('form#post').on('submit', function() {
  $('#refresh').addClass('loading');
  $('#message').trigger('blur');
  var post = new Post();
  var location = new Parse.GeoPoint({
    latitude: latitude, 
    longitude: longitude
  });
  var form = $(this);
  var message = $('#message', form);
  var distance = $('#distance', form);
  post.set('user', Parse.User.current());
  post.set('location', location);
  post.set('message', message.val());
  post.set('distance', distance.val());
  post.save(null, {
    success: function(post) {
      var image = textToImage(message.val());
      $.ajax({
        type: "POST",
        beforeSend: function(request) {
          request.setRequestHeader('X-Parse-Application-Id', parseApplicationId);
          request.setRequestHeader('X-Parse-REST-API-Key', parseRestApiKey);
          request.setRequestHeader('Content-Type', 'image/png');
        },
        url: 'https://api.parse.com/1/files/' + post.id + '.png',
        data: image,
        processData: false,
        contentType: false,
        success: function(image) {
          console.log('Image uploaded: ' + image.url);
          var params = {
            'image': {
              '__type': 'File',
              'name': image.name
            }
          };
          $.ajax({
            type: 'PUT',
            url: 'https://api.parse.com/1/classes/Post/' + post.id,
            beforeSend: function(xhr) {
              xhr.setRequestHeader('X-Parse-Application-Id', parseApplicationId);
              xhr.setRequestHeader('X-Parse-REST-API-Key', parseRestApiKey);
              xhr.setRequestHeader('Content-Type', 'application/json');
            },
            data: JSON.stringify(params),
            success: function(post) {
              console.log('Post image saved: ' + post.image.url);
              message.val('');
              distance.val(1);
              checkIn();
              $('#post-content').removeClass('open');
            },
            error: function(post, error) {
              alert('Post image save failed: ' + error.message);
            },
            dataType: 'json'
          });
        },
        error: function(error) {
          console.log('Image upload failed: ' + error.message);
        }
      });
    },
    error: function(object, error) {
      alert('Post save failed: ' + error.message);
    }
  });
  return false;
});

function login() {
  if (Parse.User.current()) {
    console.log('User already logged in.');
    checkIn();
  } else {
    var username = window.localStorage.getItem('username');
    var password = window.localStorage.getItem('password');
    if (username != null && password != null) {
      console.log('We have saved user info, loggin in.');
      Parse.User.logIn(username, password, {
        success: function(user) {
          checkIn();
        },
        error: function(user, error) {
          alert('Error logging in: ' + error.code + ' ' + error.message);
        }
      });      
    } else {
      // generate a random username and password for this client
      console.log('No saved user info, signing up.');
      var user = new Parse.User();
      var username = guid();
      var password = guid();
      user.set('username', username);
      user.set('password', password);
      user.signUp(null, {
        success: function(user) {
          window.localStorage.setItem('username', username);
          window.localStorage.setItem('password', password);
          checkIn();
        },
        error: function(user, error) {
          alert('Error signing up: ' + error.code + ' ' + error.message);
        }
      });    
    }
  }
}

function guid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
    return v.toString(16);
  });
}

function getDay(date) {
  return parseInt(date.getFullYear() + ('0' + (date.getMonth() + 1)).slice(-2) + ('0' + date.getDate()).slice(-2));
}

function checkIn() {
  var userQuery = new Parse.Query(Parse.User);
  userQuery.get(Parse.User.current().id, {
    success: function(user) {
      var location = new Parse.GeoPoint({
        latitude: latitude,
        longitude: longitude
      });
      user.set('location', location);
      user.set('checkIn', getDay(new Date()));
      user.save(null, {
        success: function(user) {
          var account = user.get('account');
          account.fetch({
            success: function(account) {
              $('#points').html(numberWithCommas(account.get('points')) + ' pt' + (account.get('points') == 1 ? '' : 's')).show();
              if (user.get('alert') != null) {
                $('#alert-content').html(user.get('alert'));
                $('#alert, #modal-background').show();
                user.set('alert', null);
                user.save();
              }
              if (window.phonegap) {
                registerForPushNotifications();      
              }
            }
          });
        }
      });
      findPosts();
    },
    error: function(user, error) {
      alert('Error getting user: ' + error.code + ' ' + error.message);
    }
  });
}

function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function updateInstallation() {
  // update the installation with the last known location for the user's device  
  var params = {
    'location': {
      '__type': 'GeoPoint',
      'latitude': latitude,
      'longitude': longitude
    },
    'badge': 0
  };
  $.ajax({
    type: 'PUT',
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
      alert('Location update for installation failed: ' + error.message);
    },
    dataType: 'json'
  });
}

function refreshLocation () {
  navigator.geolocation.getCurrentPosition(function(position) {
    latitude = position.coords.latitude;
    longitude = position.coords.longitude;    
    $('#post-content').css('background-image', 'url(http://maps.googleapis.com/maps/api/staticmap?center=' + latitude + ',' + longitude + '&zoom=15&size=640x640&maptype=terrain&sensor=true&scale=2&key=AIzaSyB8_6TbuII6dN7-I17b6N5v4z38uLQ-1P8)').css('background-size', 'cover');
    login();
  }, function(error) {
    alert('Failed to update location for device: ' + error.message);
    $('#refresh').addClass('loading');
  }, {
    maximumAge: 10000, 
    enableHighAccuracy: true,
    timeout: 144000
  });  
}

$('#refresh').fastClick(function(e) {
  $('#refresh').addClass('loading');
  refreshLocation();
  return false;
});

// phonegap code for push notifications
function registerForPushNotifications() {
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
      type: 'POST',
      url: 'https://api.parse.com/1/installations',
      beforeSend: function(xhr) {
        xhr.setRequestHeader('X-Parse-Application-Id', parseApplicationId);
        xhr.setRequestHeader('X-Parse-REST-API-Key', parseRestApiKey);
        xhr.setRequestHeader('Content-Type', 'application/json');
      },
      data: JSON.stringify(params),
      success: function(installation) {
        window.localStorage.setItem('installationId', installation.objectId);
        updateInstallation();
        console.log('Installation registered for push notifications.');
      },
      error: function(error) {
        window.localStorage.setItem('installationId', installation.objectId);
        updateInstallation();
        console.log('Registration for push notifications failed: ' + error.message);
      },
      dataType: 'json'
    });
  });
  document.addEventListener('push-notification', function(event) {
    findPosts();
    pushNotification.setApplicationIconBadgeNumber(0);
  });
}

// phonegap code for in-app purchases
function setupInAppPurchases() {
  console.log('Setting up in-app purchases.');
  var purchaseManager = window.plugins.inAppPurchaseManager;
  var productIds = ['com.davidhendee.shout.points.10', 'com.davidhendee.shout.points.100', 'com.davidhendee.shout.points.1000'];
  console.log('Fetching available products.');
  for (var i = 0; i < productIds.length; i++) {
    window.plugins.inAppPurchaseManager.requestProductData(productIds[i], 
      function(result) {
        $('#products').append('<a id="' + result.id + '" class="btn btn-primary product" data-product="' + result.id + '" href="#" data-role="button">' + result.title + ' (' + result.price + ')</a>');
        $('#' + result.id).fastClick(function() {
          var button = $(this);
          window.plugins.inAppPurchaseManager.makePurchase(button.data('product'), 1);
        });
      }, 
      function(id) {
        console.log("Invalid product id: " + result);
      }
    ); 
  }
  var Transaction = Parse.Object.extend('Transaction');
  window.plugins.inAppPurchaseManager.onPurchased = function(transactionId, productId, receipt) {
    $('#store, #modal-background').hide();
    $('#refresh').addClass('loading');
    var transaction = new Transaction();
    transaction.set('user', Parse.User.current());
    transaction.set('transactionId', transactionId);
    transaction.set('productId', productId);
    transaction.set('receipt', receipt);
    transaction.save(null, {
      success: function(transaction) {
        console.log('Saved transaction: ' + transactionId);
        $('#refresh').removeClass('loading');
        checkIn();
      },
      error: function(object, error) {
        console.log('Could not save transaction: ' + error.message);
      }
    });
  }
}

function wrapText(context, text, x, y, maxWidth, lineHeight) {
  var words = text.split(' ');
  var line = '';

  for (var n = 0; n < words.length; n++) {
    var testLine = line + words[n] + ' ';
    var metrics = context.measureText(testLine);
    var testWidth = metrics.width;
    if (testWidth > maxWidth) {
      context.fillText(line, x, y);
      line = words[n] + ' ';
      y += lineHeight;
    }
    else {
      line = testLine;
    }
  }
  context.fillText(line, x, y);
}

function dataURItoBlob(dataURI) {
  var byteString = atob(dataURI.split(',')[1]);
  var ab = new ArrayBuffer(byteString.length);
  var ia = new Uint8Array(ab);
  for (var i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: 'image/png' });
}

function textToImage(text) {
  var width = 640;
  var height = 960;
  $('body').append('<canvas id="canvas" width="' + width + '" height="' + height + '" style="display: none"></canvas>');
  var canvas = document.getElementById('canvas');
  var context = canvas.getContext('2d');
  var maxWidth = 540;
  var lineHeight = 60;
  var x = (canvas.width - maxWidth) / 2;
  var y = 120;

  context.fillStyle = '#000000';
  context.fillRect(0, 0, 640, 960);

  context.fillStyle = '#ffffff';
  context.font = 'bold 50px helvetica';
  wrapText(context, text, x, y, maxWidth, lineHeight);

  context.font = 'bold 18px helvetica';
  context.fillText('Download Shout from the app store.', 50, 880);

  var blob = dataURItoBlob(canvas.toDataURL('image/png'));

  return blob;
}

$('#share-facebook').fastClick(function() {
  var shareContent = $('#share-content');
  var text = shareContent.text();
  var image = shareContent.data('image');
  var params = {
    method: 'feed',
    link: image,
    picture: image,
    name: 'Shoutsy',
    caption: 'Shout anonymously to your block, your city, or to the world.',
    description: text
  };
  FB.ui(params, function(obj) { 
    console.log(obj);
  });
});

$('#points').fastClick(function() {
  $('#store, #modal-background').show();
  return false;
});

$('.btn-close').fastClick(function() {
  $('.modal, #modal-background').hide();
});

$(function() {
  window.phonegap = document.URL.indexOf('http://') == -1;
  if (window.phonegap) {
    document.addEventListener('deviceready', function onDeviceReady() {
      refreshLocation();
      setupInAppPurchases();
      FB.init({
        appId: '460489950704243', 
        nativeInterface: CDV.FB, 
        useCachedDialogs: false 
      });
      var toolbar = cordova.require('cordova/plugin/keyboard_toolbar_remover');
      toolbar.hide();
    });
    document.addEventListener('resume', function onResume() {
      refreshLocation();
    });    
  } else {
    refreshLocation();
  }
  document.addEventListener('touchstart', function() { }, false);
});