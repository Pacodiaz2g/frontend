var CategoryListController = ['$scope', '$rootScope', '$timeout', '$location', 'Category', 'Feed', 'Bridge', '$route', '$routeParams',
  function($scope, $rootScope, $timeout, $location, Category, Feed, Bridge, $route, $routeParams) {

    var lastRoute = $route.current;
    $scope.$on('$locationChangeSuccess', function(event) {
      if($location.path() !== '/') {
        if(lastRoute.$$route.controller === $route.current.$$route.controller) {
          // console.log(lastRoute.$$route.controller, $route.current.$$route.controller);
          // Will not load only if my view use the same controller
          // We recover new params
          new_params = $route.current.params;
          $route.current = lastRoute;
          $route.current.params = new_params;

          // get the current path
          var loc = $location.path();
          var params = $route.current.params;
          //console.log(loc, params);
          if (loc.indexOf("/c/") >= 0) {
            for (var category in $scope.categories) {
              if ($scope.categories[category].slug == params.slug) {
                $scope.category = $scope.categories[category];
                $scope.startupFeed($scope.category);
                break;
              }
            }
          }
          else if (loc.indexOf("/p/") >= 0) {
            var cn = loc.split('/');
            if(cn.length == 5) {
              cn = cn[4]; // comment number
              console.log("Watching comment:", cn);
              $scope.view_comment.position = cn;
            }
            else {
              $scope.view_comment.position = -1;
              console.log("Not watching comment");
            }
            $scope.viewPostID(params.id, params.slug);
          }
        }
        else
        {
          $scope.status.post_selected = false;
        }
      }
      else
      {
        $scope.status.post_selected = false;
      }
    });

  	$scope.categories = [];
  	$scope.resolving  = true;

    $scope.resolving = {
      categories: true,
      init: false,
      older: false,
      newer: false
    };

  	$scope.category = {};
  	$scope.posts = [];
  	$scope.resolving_posts = true;
    $scope.resolving.older = false;
  	$scope.offset = 0;
  	$scope.previewStyle = {};

    $scope.view_comment = {
      position: -1
    };

    $scope.activePostId = null;

    $scope.composer = {
      open: false,
      minimized: false
    };

    $scope.$on('status_change', function(e) {
      $scope.startupFeed($scope.category);
    });

    $scope.toggleCategories = function() {
      $scope.status.show_categories = !$scope.status.show_categories;
      $timeout(function() {
        $scope.$broadcast('changedContainers');
      }, 50);
    }

  	$scope.startupFeed = function(category) {
  		$scope.resolving_posts = true;

  		Feed.get({limit: 10, offset: 0, category: category.slug}, function(data) {
        $scope.status.pending.$value = 0;
        if(category.slug == null) {
          $scope.status.viewing.$value = 'all';
        } else {
          $scope.status.viewing.$value = category.slug;
        }
        for(p in data.feed) {
          for(c in $scope.categories) {
            if (data.feed[p].categories[0] == $scope.categories[c].slug) {
              data.feed[p].category = {name: $scope.categories[c].name, color: $scope.categories[c].color, slug: $scope.categories[c].slug}
              break;
            }
          }
        }

        if(category.slug != null) {
          $scope.page.title = "SpartanGeek.com | " + category.name;
          $scope.page.description = category.description;
        } else {
          $scope.page.title = "SpartanGeek.com | Comunidad de tecnología, geeks y más";
          $scope.page.description = "Creamos el mejor contenido para Geeks, y lo hacemos con pasión e irreverencia de Spartanos.";
        }

        $scope.status.newer_post_date = get_newer_date(data.feed);
        //console.log($scope.status.newer_post_date);
  			$scope.posts = data.feed;
  			$scope.resolving_posts = false;
  			$scope.offset = 10;

        // Category track
        mixpanel.track("View category", {offset: 0, category: category.slug});
  		});
  	};

  	$scope.walkFeed = function() {
      //console.log($scope.resolving.older);
      if(!$scope.resolving.older) {
        $scope.resolving.older = true;
        var pending = $scope.status.pending.$value==undefined?$scope.status.pending:$scope.status.pending.$value;
        //console.log($scope.offset, pending);
    		Feed.get({limit: 10, offset: $scope.offset + pending, category: $scope.category.slug}, function(data) {
          for(p in data.feed) {
            for(c in $scope.categories) {
              if (data.feed[p].categories[0] == $scope.categories[c].slug) {
                data.feed[p].category = {name: $scope.categories[c].name, color: $scope.categories[c].color, slug: $scope.categories[c].slug}
                break;
              }
            }
          }
    			$scope.posts = $scope.posts.concat(data.feed);
    			$scope.offset = $scope.offset + 10;
          $scope.resolving.older = false;
    		});

        mixpanel.track("View feed", {offset: $scope.offset, category: $scope.category.slug});
    		ga('send', 'pageview', '/feed/' + $scope.category.slug);
      } else {
        console.log("FeedGet already running...");
      }
  	};

    var get_newer_date = function(posts) {
      var newer_d = new Date(posts[0].created_at);
      var newer_i = 0;
      for(var i = 1; i < posts.length; i++) {
        var test = new Date(posts[i].created_at);
        if(newer_d < test) {
          newer_d = test;
          newer_i = i;
        }
      }
      return posts[newer_i].created_at;
    }

    $scope.get_newer = function() {
      if(!$scope.resolving.newer) {
        $scope.resolving.newer = true;
        var pending = $scope.status.pending.$value;

        Feed.get({limit: pending, before: $scope.status.newer_post_date, category: $scope.category.slug}, function(data) {
          for(p in data.feed) {
            for(c in $scope.categories) {
              if (data.feed[p].categories[0] == $scope.categories[c].slug) {
                data.feed[p].category = {name: $scope.categories[c].name, color: $scope.categories[c].color, slug: $scope.categories[c].slug}
                break;
              }
            }
            data.feed[p].unread = true;
          }
          $timeout(function() {
            for(p in data.feed) {
              data.feed[p].unread = false;
            }
          }, 800);

          $scope.status.newer_post_date = get_newer_date(data.feed);

          $scope.posts = data.feed.concat($scope.posts);
          $scope.offset = $scope.offset + pending;

          $scope.resolving.newer = false;
          $('.discussions-list').animate({ scrollTop: 0}, 100);
        });

        mixpanel.track("Load more clicked")
        ga('send', 'pageview', '/feed/' + $scope.category.slug);
      } else {
        console.log("FeedGet already running...");
      }
    };

  	$scope.turnCategory = function(category) {
  		$scope.category = category;
  		$scope.startupFeed(category);
  		$scope.previewStyle = {'background-image': 'url(/images/boards/'+$scope.category.slug+'.png)'};

  		// Reset counters if exists though
  		$scope.category.recent = 0;

      mixpanel.track("View category", {category: $scope.category.id});
  		ga('send', 'pageview', '/category/' + $scope.category.slug);
  	};

  	$scope.viewPost = function(post) {
  		$scope.activePostId = post.id;
      $scope.status.post_selected = true;
  		Bridge.changePost(post);
      //$(window).scrollTop(0);

      mixpanel.track("View post", {id: post.id, category: $scope.category.id});
  		ga('send', 'pageview', '/post/' + $scope.category.slug + '/' + post.id);
  	};

    $scope.viewPostID = function(postId, slug) {
      $scope.activePostId = postId;
      $scope.status.post_selected = true;
      Bridge.changePost({id: postId, slug: slug, name: ""});

      mixpanel.track("View post", {id: postId, category: $scope.category.id});
      ga('send', 'pageview', '/post/' + slug + '/' + postId);
    };

    $scope.reloadPost = function() {
      $scope.viewPostID($scope.activePostId, "");
    }

    $scope.$on('reloadPost', function(e) {
      $scope.reloadPost();
    });

    // If logged, don't show categories
    if($scope.user.isLogged) {
      $scope.status.show_categories = false;
    }

  	// Resolve categories though
  	Category.query(function(data) {
  		$scope.resolving.categories = false;
  		$scope.categories = data;

      $timeout(function() {
        $scope.$broadcast('changedContainers');
      }, 100);

  		// Once the categories has been resolved then catch the first one and try to fetch the feed for it
  		var path = $location.path();
  		var loaded = false;

  		if (path.length > 0) {
  			var segments = path.split("/");
        var section_segment = segments[1];
  			var category_segment = segments[2];

        if(section_segment === 'c') {
    			for (var category in $scope.categories) {
    				if ($scope.categories[category].slug == category_segment) {
    					$scope.category = $scope.categories[category];
    					$scope.startupFeed($scope.category);
    					$scope.$broadcast('scrollMeUpdate');
    					loaded = true;
              break;
    				}
    			}
        } else if(section_segment === 'p') {
          $scope.viewPostID($routeParams.id, $routeParams.slug);
          var cn = path.split('/');
          if(cn.length == 5) {
            cn = cn[4]; // comment number
            console.log("Watching comment:", cn);
            $scope.view_comment.position = cn;
          }
          else {
            $scope.view_comment.position = -1;
          }
        }
  		}
  		if (loaded == false) {
  			$scope.startupFeed($scope.category);
  		}
  	});
  }
];