$(document).ready(function() {
  Parse.initialize('CBV56vJgLv8chR4XfRjepzFhTTc88KXdR2xiO5Ic', 'z4ToJJNWGSeYeLh5MIEsJ5bMtOd7R7KMyuYgch0p');
  var Post = Parse.Object.extend('Post');

  navigator.geolocation.getCurrentPosition(function(position) {
    var location = new Parse.GeoPoint({
      latitude: position.coords.latitude, 
      longitude: position.coords.longitude
    });

    // $('#map').css('background', 'url(http://maps.googleapis.com/maps/api/staticmap?center=' + position.coords.latitude + ',' + position.coords.longitude + '&zoom=10&size=50x50&maptype=terrain&sensor=true) center center no-repeat').css('background-size', 'cover');

    function findPosts() {
      $.mobile.loading('show');
      $('#refresh').addClass('ui-disabled');
      $('#notice').html('');

      var posts = new Parse.Query(Post);
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

    $('#refresh').click(function(e) {
      findPosts();
      return false;
    });

    findPosts();

    $('#post').submit(function(e) {
      var post = new Post();
      var message = $('#message');

      post.set('location', location);
      post.set('message', message.val());

      message.blur();

      post.save(null, {
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

  }, function(error) {
    console.log(error)
  }, {
    maximumAge: 60000, 
    timeout: 5000, 
    enableHighAccuracy: true
  });
});
