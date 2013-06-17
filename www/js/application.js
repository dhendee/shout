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
  loading(true);
  $('#notice').html('');

  var location = new Parse.GeoPoint({
    latitude: latitude, 
    longitude: longitude
  });

  var worldPosts = new Parse.Query(Post);
  worldPosts.equalTo('distance', '1000');

  var statePosts = new Parse.Query(Post);
  statePosts.equalTo('distance', '100');
  statePosts.withinMiles('location', location, 100);

  var cityPosts = new Parse.Query(Post);
  cityPosts.equalTo('distance', '10');
  cityPosts.withinMiles('location', location, 10);

  var neighborhoodPosts = new Parse.Query(Post);
  neighborhoodPosts.equalTo('distance', '1');
  neighborhoodPosts.withinMiles('location', location, 1);

  var posts = Parse.Query.or(neighborhoodPosts, cityPosts, statePosts, worldPosts);
  posts.descending('createdAt');
  posts.limit(100);
  // i'm not sure you can limit like this. 
  // it's finding the nearest 100, not the most recent
  // think you need to use a different query:
  // withinGeoBox(key, southwest, northeast)
  // and you can find the bounding box using this technique:
  // http://janmatuschek.de/LatitudeLongitudeBoundingCoordinates
  // the subqueries can't be limited either way, so they might just not work.

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
              distance = 'in this neighborhood';
              break;
            case '10':
              distance = 'in this city';
              break;
            case '100':
              distance = 'in this country';
              break;
            default:
              distance = 'somewhere on earth';
          }
          // todo: placeholder image for failed image saves?
          var image = post.get('image') ? post.get('image')._url : '';
          var color = post.get('color') ? post.get('color') : 'black';
          list.append('<li data-post="' + post.id + '" data-image="' + image + '"><p class="message ' + color + '">' + post.get('message') + ' </p><small><time class="timeago" datetime="' + createdAt + '">' + createdAt + '</time>, ' + distance +  '<a class="actions btn btn-small" href="#">&hellip;</a></small></li>');
        }
        list.find('li .actions').fastClick(function() {
          var item = $(this).parents('li');
          var text = $('.message', item).text();
          var image = item.data('image');
          var post = item.data('post');
          var shareFacebook = $('#share-facebook');
          shareFacebook.data('message', text);
          shareFacebook.data('image', image);
          var shareTwitter = $('#share-twitter');
          shareTwitter.fastClick(function() {
            $('.modal').modal('hide');
            track('share', 'twitter', text);
            window.open('http://twitter.com/share?text=' + encodeURIComponent(text) + '&via=schowt&url=http://schowt.com', '_system');
          });
          var sharePinterest = $('#share-pinterest');
          sharePinterest.fastClick(function() {
            $('.modal').modal('hide');
            track('share', 'pinterest', text);
            window.open('http://pinterest.com/pin/create/button/?url=http://schowt.com&description=' + encodeURIComponent('Heard on Schowt: ' + text) + '&media=' + image, '_system');
          });
          var flag = $('#flag');
          flag.data('post', post);
          $('#actions').modal('show');
          return false;
        });
        $('time.timeago').timeago();
      }
      loading(false);
    },
    error: function(error) {
      alert('Error finding posts: ' + error.code + ' ' + error.message);
      loading(false);
    }
  });
}

$('#message').on('keyup', function() {
  var textarea = $(this);
  var button = $('#submit-post');
  if (textarea.val() == '') {
    button.addClass('disabled');
  } else {
    button.removeClass('disabled');
  }
  track('post', 'compose');
});

function setMapImages() {
  $('#map #distance-1').css('background-image', 'url(http://maps.googleapis.com/maps/api/staticmap?center=' + latitude + ',' + longitude + '&zoom=' + 15 + '&size=100x100&maptype=terrain&sensor=true&scale=2&key=AIzaSyB8_6TbuII6dN7-I17b6N5v4z38uLQ-1P8)').css('background-size', 'cover');
  $('#map #distance-2').css('background-image', 'url(http://maps.googleapis.com/maps/api/staticmap?center=' + latitude + ',' + longitude + '&zoom=' + 13 + '&size=240x240&maptype=terrain&sensor=true&scale=2&key=AIzaSyB8_6TbuII6dN7-I17b6N5v4z38uLQ-1P8)').css('background-size', 'cover');
  $('#map #distance-3').css('background-image', 'url(http://maps.googleapis.com/maps/api/staticmap?center=' + latitude + ',' + longitude + '&zoom=' + 5 + '&size=480x480&maptype=terrain&sensor=true&scale=2&key=AIzaSyB8_6TbuII6dN7-I17b6N5v4z38uLQ-1P8)').css('background-size', 'cover');
  $('#map #distance-4').css('background-image', 'url(http://maps.googleapis.com/maps/api/staticmap?center=' + latitude + ',' + longitude + '&zoom=' + 1 + '&size=600x400&maptype=terrain&sensor=true&scale=2&key=AIzaSyB8_6TbuII6dN7-I17b6N5v4z38uLQ-1P8)').css('background-size', 'cover');
}

$('a.distance').fastClick(function() {
  var link = $(this);
  $('a.distance').removeClass('selected');
  link.addClass('selected');
  var select = $('#distance');
  var val = link.data('val');
  select.val(val);
  $('#cost').data('total', val).html(numberWithCommas(val));
  $('#current-distance').html($('option:selected', select).text());
  checkCost();
  return false;
});

$('a.swatch').fastClick(function() {
  var link = $(this);
  var select = $('#color');
  $('a.swatch').removeClass('selected');
  link.addClass('selected');
  $('#message, #current-color').removeClass('black gray red orange yellow green blue purple').addClass(link.attr('id'));
  select.val(link.attr('id'));
  return false;
});

function checkCost() {
  var points = $('#points').data('total');
  var costLabel = $('#cost');
  var cost = costLabel.data('total');
  if (cost > points) {
    costLabel.parent().addClass('error');
    $('submit-post').addClass('disabled');
  } else {
    costLabel.parent().removeClass('error');
    $('submit-post').removeClass('disabled');
  }
}

$('#set-distance').fastClick(function() {
  var link = $(this);
  $('#post-actions a').removeClass('selected');
  link.addClass('selected');
  $('#colors').hide();
  $('#map').show();
});

$('#set-color').fastClick(function() {
  var link = $(this);
  $('#post-actions a').removeClass('selected');
  link.addClass('selected');
  $('#map').hide();
  $('#colors').show();
});

$('#message').on('focus', function() {
  window.setTimeout(function() {
    window.scroll(0, 0); 
  }, 1);
  $('#set-distance').removeClass('selected');
});

$('#submit-post').fastClick(function() {
  var form = $('form#post');
  var message = $('#message', form).val();
  if (message == '') {
    return false;
  } else {
    form.submit();
  }
});

$('form#post').on('submit', function() {
  loading(true);
  $('#compose').modal('hide');
  var form = $(this);
  var post = new Post();
  var location = new Parse.GeoPoint({
    latitude: latitude, 
    longitude: longitude
  });
  var messageField = $('#message', form);
  var message = messageField.val();
  var distanceField = $('#distance', form);
  var distance = distanceField.val();
  var colorField = $('#color', form);
  var color = colorField.val();
  messageField.val('');
  post.set('user', Parse.User.current());
  post.set('location', location);
  post.set('message', message);
  post.set('distance', distance);
  post.set('color', color);
  track('post', 'submit', message);
  post.save(null, {
    success: function(post) {
      var imageBlob = textToImage(message, color);
      $.ajax({
        type: "POST",
        beforeSend: function(request) {
          request.setRequestHeader('X-Parse-Application-Id', parseApplicationId);
          request.setRequestHeader('X-Parse-REST-API-Key', parseRestApiKey);
          request.setRequestHeader('Content-Type', 'image/png');
        },
        url: 'https://api.parse.com/1/files/' + post.id + '.png',
        data: imageBlob,
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
              console.log('Post image saved.');
              checkIn();
              resetPostForm();
              track('post', 'create');
            },
            error: function(post, error) {
              resetPostForm();
              alert('Post image save failed: ' + error.message);
            },
            dataType: 'json'
          });
        },
        error: function(error) {
          resetPostForm();
          alert('Image upload failed: ' + error.message);
        }
      });
    },
    error: function(object, error) {
      resetPostForm();
      alert('Post save failed: ' + error.message);
    }
  });
  return false;
});

function resetPostForm() {
  $('#canvas').remove();
}

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
              var link = $('#points');
              link.data('total', account.get('points')).html(numberWithCommas(account.get('points')) + ' pt' + (account.get('points') == 1 ? '' : 's')).show();
              $('#total').html(link.html());
              if (user.get('alert') != null) {
                $('#alert-content').html(user.get('alert'));
                $('#alert').modal('show');
                user.set('alert', null);
                user.save();
              }
              if (window.phonegap) {
                registerForPushNotifications();      
              }
              track('user', 'checkin', Parse.User.current());
            }
          });
        }
      });
      findPosts();
    },
    error: function(user, error) {
      // todo: this fails a lot on resume, so we should figure out why.
      // but it's not hurting things overall and is worse as an alert.
      // alert('Error getting user: ' + error.code + ' ' + error.message);
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
    setMapImages();
    login();
  }, function(error) {
    alert('Failed to update location for device: ' + error.message + ' (code ' + error.code + ')');
    loading(false);
  }, {
    maximumAge: 0, 
    enableHighAccuracy: false
  });
}

$('#refresh').fastClick(function() {
  scrollToTop();
  loading(true);
  refreshLocation();
  return false;
});

$('#create-post').fastClick(function() {
  $('#compose').modal('show', function() {
    $('#message').trigger('focus');
  });
});

function scrollToTop() {
  $('#posts-content', '#index').animate({scrollTop: 0}, 'fast');
}

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
  var productIds = ['com.davidhendee.schowt.product.10', 'com.davidhendee.schowt.product.100', 'com.davidhendee.schowt.product.1000'];
  console.log('Fetching available products.');
  var list = $('#products');
  for (var i = 0; i < productIds.length; i++) {
    list.append('<a id="' + productIds[i] + '" class="btn btn-primary product" data-product="' + productIds[i] + '" href="#"></a>');
  }  
  for (var i = 0; i < productIds.length; i++) {
    window.plugins.inAppPurchaseManager.requestProductData(productIds[i], function(result) {
      var link = $('.product[data-product="' + result.id + '"]');
      link.html(result.title + ' (' + result.price + ')');
      link.fastClick(function() {
        var button = $(this);
        window.plugins.inAppPurchaseManager.makePurchase(button.data('product'), 1);
        return false;
      });
    }, 
    function(id) {
      console.log("Invalid product id: " + result);
    }); 
  }
  var Transaction = Parse.Object.extend('Transaction');
  window.plugins.inAppPurchaseManager.onPurchased = function(transactionId, productId, receipt) {
    $('#store, #modal-background').hide();
    loading(true);
    var transaction = new Transaction();
    transaction.set('user', Parse.User.current());
    transaction.set('transactionId', transactionId);
    transaction.set('productId', productId);
    transaction.set('receipt', receipt);
    transaction.save(null, {
      success: function(transaction) {
        console.log('Saved transaction: ' + transactionId);
        loading(false);
        checkIn();
        track('products', 'purchase', productId);
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

function textToImage(text, color) {
  var width = 600;
  // create a mock of the layout to get the height for the canvas...might be a better way to dynamically size it.
  $('#posts').prepend('<li id="template"><p class="message ' + color + '">' + text + '</p></li>');
  var template = $('#template');
  var height = $('.message', template).outerHeight() * 2;
  var colorValue = $('.message', template).css('background-color');
  template.remove();
  $('body').append('<canvas id="canvas" width="' + width + '" height="' + height + '" style="display: none"></canvas>');
  var canvas = document.getElementById('canvas');
  var context = canvas.getContext('2d');
  var maxWidth = 540;
  var lineHeight = 64;
  var x = (canvas.width - maxWidth) / 2;
  var y = 80;

  context.fillStyle = colorValue;
  context.fillRect(0, 0, width, height);

  context.fillStyle = '#ffffff';
  context.font = 'bold 60px "Avant Garde Bold"';
  wrapText(context, text.toUpperCase(), x, y, maxWidth, lineHeight);

  drawLogo(context, canvas.width, canvas.height);
  return dataURItoBlob(canvas.toDataURL('image/png'));
}

$('#share-facebook').fastClick(function() {  
  var link = $(this);
  var text = link.data('message');
  var image = link.data('image');
  var params = {
    method: 'feed',
    link: 'http://www.schowt.com',
    picture: image,
    name: 'Schowt',
    caption: 'Heard on Schowt:',
    description: text
  };
  FB.ui(params, function(obj) { 
    console.log(obj);
  });
  track('share', 'facebook', text);
  return true;
});

$('#flag').fastClick(function() {
  loading(true);
  $('.modal').modal('hide');
  var link = $(this);
  var postQuery = new Parse.Query(Post);
  postQuery.get(link.data('post'), {
    success: function(post) {
      var flags = post.relation('flags');
      flags.add(Parse.User.current());
      post.save(null, {
        success: function(post) {
          loading(false);
          notify('We\'ll look into it. Thank\'s for keeping Schowt friendly.');
        },
        error: function(object, error) {
          alert('Could not update post: ' + error.message);
        }
      });
      track('post', 'flag', post.get('message'));
      return true;
    },
    error: function(object, error) {
      alert('Could not find post: ' + error.message);
    }
  });
});

$('#points, #cost').fastClick(function() {
  track('products', 'browse');
  $('#store').modal('show');
});

$.fn.extend({
  modal: function(command, cb) {
    return this.each(function() {
      var el = $(this);
      var background = $('#modal-background');
      if (command == 'show') {
        if (el.hasClass('screen') == false) {
          var centeredTop = Math.round(($(window).height() - $(this).outerHeight()) / 2);
          el.data('top', el.css('top'));
          el.css('top', centeredTop);
        }
        background.addClass('show');
        el.addClass('show');
      } else {
        background.removeClass('show');        
        el.css('top', el.data('top'));
        el.removeClass('show');
      }
      if (cb && typeof cb === 'function') {
        cb();
      }
    });
  }
});

$('.btn-close, .btn-back').fastClick(function() {
  $('.modal').modal('hide');
  return false;
});

function notify(text) {
  $('#alert-content').html(text);
  $('#alert').modal('show');
}

function loading(state) {
  if (window.phonegap) {
    if (state == false) {
      navigator.notificationEx.activityStop();
    } else {
      navigator.notificationEx.activityStart();
    }
  }
}

function track(category, action, label) {
  _gaq.push(['_trackEvent', category, action, label != undefined ? label : null]);
}

function setupStatusTap() {
  window.plugins.tapToScroll.initListener();
  window.addEventListener('statusTap', function() {
    scrollToTop();
  });
}

$(function() {
  window.phonegap = document.URL.indexOf('http://') == -1;
  if (window.phonegap) {
    document.addEventListener('deviceready', function onDeviceReady() {
      refreshLocation();
      FB.init({
        appId: '460489950704243', 
        nativeInterface: CDV.FB, 
        useCachedDialogs: false 
      });
      setupInAppPurchases();
      var toolbar = cordova.require('cordova/plugin/keyboard_toolbar_remover');
      toolbar.hide();
      setupStatusTap();
    });
    document.addEventListener('resume', function onResume() {
      refreshLocation();
    });    
    document.addEventListener('touchstart', function() { }, false);
  } else {
    refreshLocation();
  }
});