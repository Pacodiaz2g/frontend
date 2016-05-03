var ChatController = [
  '$scope',
  '$firebaseArray',
  '$firebaseObject',
  '$timeout',
  '$location',
  '$route',
  '$routeParams',
  function($scope, $firebaseArray, $firebaseObject, $timeout, $location, $route, $routeParams) {

    $scope.people = [];

    $scope.emojiMessage = {};

    var firebaseRef = new Firebase(firebase_url);

    // Instantiate a new connection to Firebase.
    $scope._firebase = firebaseRef;

    // A unique id generated for each session.
    $scope._sessionId = null;

    // A mapping of event IDs to an array of callbacks.
    $scope._events = {};

    // A mapping of room IDs to a boolean indicating presence.
    $scope._rooms = {};

    // A mapping of operations to re-queue on disconnect.
    $scope._presenceBits = {};

    // Commonly-used Firebase references.
    $scope._userRef        = null;
    $scope._statusRef      = null;
    $scope._messageRef     = $scope._firebase.child('messages');
    $scope._channelRef     = $scope._firebase.child('channels');
    //$scope._privateRoomRef = $scope._firebase.child('room-private-metadata');
    //$scope._moderatorsRef  = $scope._firebase.child('moderators');
    $scope._suspensionsRef = $scope._firebase.child('suspensions');
    //$scope._usersOnlineRef = $scope._firebase.child('user-names-online');

    // Setup and establish default options.
    $scope._options = {};

    // The number of historical messages to load per room.
    $scope._options.numMaxMessages = $scope._options.numMaxMessages || 50;

    $scope.channels = [];
    $scope.channel = {
      selected: null
    };
    $scope.messages = [];
    $scope.old_messages = [];
    $scope.message = {
      content: '',
      send_on_enter: true,
      previous: '-'
    };
    $scope.show_details = false;

    $scope.members = [];
    $scope.searchText = {
      content: ''
    };

    $scope.helpers = {
      writing: false,
      writing_timeout: null,
      spam_count: 0,
      validated: false,
      loaded: false,
      blocked: false
    };

    $scope.getMentionable = function() {
      var new_people = [];

      angular.forEach($scope.members, function(member) {
        new_people.push({'label': member.username});
      })
      $scope.people = new_people;
    }

    $scope.goToBottom = function() {
      var mh_window = $('.message-history');
      mh_window.scrollTop(mh_window[0].scrollHeight);
      $scope.old_messages = [];
      $scope.scroll_help.scrolledUp = false;
    }

    $scope.changeChannel = function(channel) {
      if($scope.channel.selected == channel) return;

      if($scope.channel.selected != null) {
        $scope.exitChannel();
      }
      $scope.channel.selected = channel;
      $location.path('/chat/' + channel.slug);

      var messagesRef = $scope._messageRef.child(channel.$id).orderByChild('created_at').limitToLast(50);

      if($scope.channel.selected.fullscreen) {
        $scope.channel.selected.new_yt_code = $scope.channel.selected.fullscreen.video;
      } else {
        $scope.channel.selected.new_yt_code = "";
      }
      $scope.messages = $firebaseArray( messagesRef );

      // When messages are loaded on UI and also when a new message arrives
      $scope.messages.$loaded().then(function(x) {
        $timeout(function() {
          var mh_window = $('.message-history');
          mh_window.scrollTop(mh_window[0].scrollHeight);
        }, 0);

        x.$watch(function(event) {
          if(event.event === "child_added") {
            if(!$scope.scroll_help.scrolledUp) {
              $timeout(function() {
                var mh_window = $('.message-history');
                mh_window.scrollTop(mh_window[0].scrollHeight);
              }, 0);
            }
          }
        });
      });

      messagesRef.on('child_removed', function(dataSnapshot) {
        if($scope.scroll_help.scrolledUp) {
          $scope.old_messages = $scope.old_messages.concat( dataSnapshot.val() );
        } else {
          $scope.old_messages = [];
        }
      });

      var membersRef = new Firebase(firebase_url + 'members/' + channel.$id);
      $scope.members = $firebaseArray(membersRef);

      membersRef.on('value', function(snapshot) {
        var new_people = [];
        snapshot.forEach(function(childSnapshot) {
          new_people.push({'label': childSnapshot.val().username});
        });
        $scope.people = new_people;
      });

      // Some status validation if user is logged in
      if($scope.user.isLogged) {
        var amOnline = new Firebase(firebase_url + '.info/connected');
        $scope._statusRef = new Firebase(firebase_url + 'members/' + channel.$id + '/' + $scope.user.info.id);

        amOnline.on('value', function(snapshot) {
          if(snapshot.val()) {
            var image = $scope.user.info.image || "";
            $scope._statusRef.onDisconnect().remove();
            $scope._statusRef.on('value', function(ss) {
              if( ss.val() == null ) {
                // another window went offline, so mark me still online
                $scope._statusRef.set({
                  id: $scope.user.info.id,
                  username: $scope.user.info.username,
                  image: image,
                  writing: false
                });
              }
            });
          }
        });
      }
    };

    $scope.exitChannel = function() {
      if($scope.channel.selected) {
        channel = $scope.channel.selected;
        if($scope.user.isLogged) {
          $scope._statusRef.off();
          //var statusRef = new Firebase(firebase_url + 'members/' + channel.$id + '/' + $scope.user.info.id);
          $scope._statusRef.set(null);
        }
      }
    };

    $scope.updateChannelMeta = function(){
      if($scope.channel.selected.new_yt_code == "") {
        $scope.channel.selected.fullscreen = null;
      } else {
        if(!$scope.channel.selected.fullscreen) {
          $scope.channel.selected.fullscreen = {
            video: null
          };
        }
        $scope.channel.selected.fullscreen.video = $scope.channel.selected.new_yt_code;
      }
      $scope.channels.$save($scope.channel.selected);
    }

    $scope.addMessage = function() {
      $scope.message.content = $scope.emojiMessage.messagetext;

      if($scope.message.content != '' && $scope.message.content.length < 201) {
        if($scope.message.content === $scope.message.previous || ($scope.message.previous.indexOf($scope.message.content) > -1) || ($scope.message.content.indexOf($scope.message.previous) > -1)) {

          $scope.helpers.spam_count++;
        } else {
          if($scope.helpers.spam_count > 0) {
            $scope.helpers.spam_count--;
          }
        }

        if($scope.helpers.spam_count > 2) {
          $('.emoji-wysiwyg-editor').blur();
          $scope._userRef.child('chat/blocked').set(true);
          $scope.helpers.spam_count = 0;

          $scope.message.content = '';
          $scope.emojiMessage = {};
        } else {
          $scope.message.previous = $scope.message.content;

          if($scope.message.content !== '') {
            var image = $scope.user.info.image || "";
            var new_message = {
              author: {
                id: $scope.user.info.id,
                username: $scope.user.info.username,
                image: image
              },
              content: $scope.message.content,
              created_at: Firebase.ServerValue.TIMESTAMP
            };
            if($scope.message.highlight) {
              new_message.highlight = true;
            }
            //console.log(new_message);
            $scope.messages.$add(new_message).then(function(ref) {
              $scope.message.content = '';
              $scope.emojiMessage = {};
            });
          }
        }
      }
    }

    $scope.addMessageNew = function($event) {
      if($event.which === 13 && $scope.message.send_on_enter) {
        $timeout(function(){
          $scope.addMessage();
          $timeout.cancel($scope.helpers.writing_timeout);
          $scope._statusRef.child('writing').set(false);
          $scope.helpers.writing = false;
          $event.preventDefault();
        }, 0);
      } else {
        if(!$scope.helpers.writing) {
          $scope._statusRef.child('writing').set(true);
          $scope.helpers.writing = true;
        }
        if($scope.helpers.writing_timeout) $timeout.cancel($scope.helpers.writing_timeout);
        $scope.helpers.writing_timeout = $timeout(function() {
          $scope._statusRef.child('writing').set(false);
          $scope.helpers.writing = false;
        }, 1000); // delay in ms
      }
    }

    $scope.removeMessage = function(message) {
      $scope.messages.$remove(message).then(function(ref) {
        console.log(ref.key() === message.$id); // true
      });
    }

    $scope.toggle_details = function() {
      $scope.show_details = !$scope.show_details;
    }

    $scope.suspendUser = function(userId, timeLengthSeconds) {
      //var suspendedUntil = new Date().getTime() + 1000*timeLengthSeconds;

      $scope._suspensionsRef.child(userId).set(true, function(error) {
        if (error) {
          console.log("error in user ban")
        } else {
          console.log("user was banned")
        }
      });
    };

    $scope.channels = $firebaseArray($scope._channelRef);
    $scope.channels.$loaded().then(function() {
      if($routeParams.slug != undefined) {
        var found = false;
        for(i in $scope.channels) {
          if($scope.channels[i].slug == $routeParams.slug) {
            $scope.changeChannel($scope.channels[i]);
            found = true;
            break;
          }
        }
        if(!found) {
          $scope.changeChannel($scope.channels[0]);
        }
      } else {
        $scope.changeChannel($scope.channels[0]);
      }
    });

    $scope.checkValidation = function() {
      if($scope.user.isLogged) {
        $scope.promises.self.then(function(){

          $scope._userRef = $scope._firebase.child("users").child($scope.user.info.id);

          $scope._userRef.child('validated').once('value', function(ss) {
            if(ss.val() == true) {
              $scope.helpers.validated = true;
            }
          });

          $scope._userRef.child('chat/blocked').on('value', function(ss) {
            if(ss.val() == true) {
              $scope.helpers.blocked = true;
              $timeout(function(){
                $scope._userRef.child('chat/blocked').set(null);
                $scope.helpers.blocked = false;
              }, 60000);
            }
          });

        });
      }
    };
    $scope.checkValidation();

    $scope.$on("userLogged", function() {
      $scope.checkValidation();
    });

    $scope.$on("$destroy", function() {
      if($scope.can('debug')) console.log("Closing chat");
      $scope.exitChannel();
    });

    // Scrolling responses
    $scope.scroll_help = {
      lastScrollTop: 0,
      from_top: 0,
      max_height: 0,
      last_height: 0,
      scrolledUp: false
    }

    jQuery('.message-history').scroll(function() {
      $scope.scroll_help.from_top = $(this).scrollTop();
      $scope.scroll_help.max_height = $(this)[0].scrollHeight - $(this).height();

      // If scrolling further than possible... (happens because of some OS effects)
      if($scope.scroll_help.from_top > $scope.scroll_help.max_height) {
        $scope.scroll_help.from_top = $scope.scroll_help.max_height; // we "saturate" from_top distance
      }

      if ($scope.scroll_help.from_top >= $scope.scroll_help.lastScrollTop) {
        // downscroll code
        //if($scope.can('debug')) console.log("Scrolling downward");
        if($scope.scroll_help.from_top == $scope.scroll_help.max_height) {
          $scope.scroll_help.scrolledUp = false;
          $scope.old_messages = [];
        }
      } else {
        //if($scope.can('debug')) console.log("Scrolling upward");
        if($scope.scroll_help.last_height <= $scope.scroll_help.max_height) {
          // upscroll code
          $scope.scroll_help.scrolledUp = true;
        }
      }
      $scope.scroll_help.lastScrollTop = $scope.scroll_help.from_top;
      $scope.scroll_help.last_height = $scope.scroll_help.max_height;
    });

    // Hack, so we don't have to reload the controller if the route uses the same controller
    var lastRoute = $route.current;
    $scope.$on('$locationChangeSuccess', function(event) {
      if(lastRoute.$$route.controller === $route.current.$$route.controller) {
        // Will not load only if my view use the same controller
        // We recover new params
        new_params = $route.current.params;
        $route.current = lastRoute;
        $route.current.params = new_params;
      }
    });
  }
];

var chatModule = angular.module('chatModule', ['firebase', 'ngSanitize', 'emojiApp']);

chatModule.controller('ChatController', ChatController);

chatModule.directive('sgEnter', function() {
  return {
    link: function(scope, element, attrs) {
      //console.log(scope.message.send_on_enter);
      element.bind("keydown keypress", function(event) {
        if(event.which === 13 && scope.message.send_on_enter) {
          scope.$apply(function(){
            scope.$eval(attrs.sgEnter, {'event': event});
          });
          event.preventDefault();
        }
      });
    }
  };
});

chatModule.directive('youtube', function($sce) {
  return {
    restrict: 'EA',
    scope: {
      code: '='
    },
    replace: true,
    template: '<div class="yt-video"><iframe style="overflow:hidden;height:100%;width:100%" width="100%" height="100%" src="{{url}}" frameborder="0" allowfullscreen></iframe></div>',
    link: function (scope) {
      scope.$watch('code', function (newVal) {
        if (newVal) {
          scope.url = $sce.trustAsResourceUrl("https://www.youtube.com/embed/" + newVal);
        }
      });
    }
  };
});

chatModule.directive('showImages', [function() {
  var urlPattern = /(http|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?/gi;
  /*var regex = new RegExp("(https?:\/\/.*\\.(?:png|jpg|jpeg|gif)((\\?|\\&)[a-zA-Z0-9]+\\=[a-zA-Z0-9]+)*)", "gi");
  var to_replace = "<div class=\"img-preview\"><div class=\"url-text\">$1 <i class=\"fa fa-chevron-down\"></i><i class=\"fa fa-chevron-up\"></i></div><a href=\"$1\" target=\"_blank\" ng-show=\"show_image\"><img src=\"$1\"></a></div>";*/

  var entityMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': '&quot;',
    "'": '&#39;'
  };

  function escapeHtml(string) {
    return String(string).replace(/[&<>"']/g, function (s) {
      return entityMap[s];
    });
  }

  var emojis = [
    "bowtie", "smile", "laughing", "blush", "smiley", "relaxed",
    "smirk", "heart_eyes", "kissing_heart", "kissing_closed_eyes", "flushed",
    "relieved", "satisfied", "grin", "wink", "stuck_out_tongue_winking_eye",
    "stuck_out_tongue_closed_eyes", "grinning", "kissing",
    "kissing_smiling_eyes", "stuck_out_tongue", "sleeping", "worried",
    "frowning", "anguished", "open_mouth", "grimacing", "confused", "hushed",
    "expressionless", "unamused", "sweat_smile", "sweat",
    "disappointed_relieved", "weary", "pensive", "disappointed", "confounded",
    "fearful", "cold_sweat", "persevere", "cry", "sob", "joy", "astonished",
    "scream", "neckbeard", "tired_face", "angry", "rage", "triumph", "sleepy",
    "yum", "mask", "sunglasses", "dizzy_face", "imp", "smiling_imp",
    "neutral_face", "no_mouth", "innocent", "alien", "yellow_heart",
    "blue_heart", "purple_heart", "heart", "green_heart", "broken_heart",
    "heartbeat", "heartpulse", "two_hearts", "revolving_hearts", "cupid",
    "sparkling_heart", "sparkles", "star", "star2", "dizzy", "boom",
    "collision", "anger", "exclamation", "question", "grey_exclamation",
    "grey_question", "zzz", "dash", "sweat_drops", "notes", "musical_note",
    "fire", "hankey", "poop", "shit", "\\+1", "thumbsup", "-1", "thumbsdown",
    "ok_hand", "punch", "facepunch", "fist", "v", "wave", "hand", "raised_hand",
    "open_hands", "point_up", "point_down", "point_left", "point_right",
    "raised_hands", "pray", "point_up_2", "clap", "muscle", "metal", "fu",
    "walking", "runner", "running", "couple", "family", "two_men_holding_hands",
    "two_women_holding_hands", "dancer", "dancers", "ok_woman", "no_good",
    "information_desk_person", "raising_hand", "bride_with_veil",
    "person_with_pouting_face", "person_frowning", "bow", "couplekiss",
    "couple_with_heart", "massage", "haircut", "nail_care", "boy", "girl",
    "woman", "man", "baby", "older_woman", "older_man",
    "person_with_blond_hair", "man_with_gua_pi_mao", "man_with_turban",
    "construction_worker", "cop", "angel", "princess", "smiley_cat",
    "smile_cat", "heart_eyes_cat", "kissing_cat", "smirk_cat", "scream_cat",
    "crying_cat_face", "joy_cat", "pouting_cat", "japanese_ogre",
    "japanese_goblin", "see_no_evil", "hear_no_evil", "speak_no_evil",
    "guardsman", "skull", "feet", "lips", "kiss", "droplet", "ear", "eyes",
    "nose", "tongue", "love_letter", "bust_in_silhouette",
    "busts_in_silhouette", "speech_balloon", "thought_balloon", "feelsgood",
    "finnadie", "goberserk", "godmode", "hurtrealbad", "rage1", "rage2",
    "rage3", "rage4", "suspect", "trollface", "sunny", "umbrella", "cloud",
    "snowflake", "snowman", "zap", "cyclone", "foggy", "ocean", "cat", "dog",
    "mouse", "hamster", "rabbit", "wolf", "frog", "tiger", "koala", "bear",
    "pig", "pig_nose", "cow", "boar", "monkey_face", "monkey", "horse",
    "racehorse", "camel", "sheep", "elephant", "panda_face", "snake", "bird",
    "baby_chick", "hatched_chick", "hatching_chick", "chicken", "penguin",
    "turtle", "bug", "honeybee", "ant", "beetle", "snail", "octopus",
    "tropical_fish", "fish", "whale", "whale2", "dolphin", "cow2", "ram", "rat",
    "water_buffalo", "tiger2", "rabbit2", "dragon", "goat", "rooster", "dog2",
    "pig2", "mouse2", "ox", "dragon_face", "blowfish", "crocodile",
    "dromedary_camel", "leopard", "cat2", "poodle", "paw_prints", "bouquet",
    "cherry_blossom", "tulip", "four_leaf_clover", "rose", "sunflower",
    "hibiscus", "maple_leaf", "leaves", "fallen_leaf", "herb", "mushroom",
    "cactus", "palm_tree", "evergreen_tree", "deciduous_tree", "chestnut",
    "seedling", "blossom", "ear_of_rice", "shell", "globe_with_meridians",
    "sun_with_face", "full_moon_with_face", "new_moon_with_face", "new_moon",
    "waxing_crescent_moon", "first_quarter_moon", "waxing_gibbous_moon",
    "full_moon", "waning_gibbous_moon", "last_quarter_moon",
    "waning_crescent_moon", "last_quarter_moon_with_face",
    "first_quarter_moon_with_face", "moon", "earth_africa", "earth_americas",
    "earth_asia", "volcano", "milky_way", "partly_sunny", "octocat", "squirrel",
    "bamboo", "gift_heart", "dolls", "school_satchel", "mortar_board", "flags",
    "fireworks", "sparkler", "wind_chime", "rice_scene", "jack_o_lantern",
    "ghost", "santa", "christmas_tree", "gift", "bell", "no_bell",
    "tanabata_tree", "tada", "confetti_ball", "balloon", "crystal_ball", "cd",
    "dvd", "floppy_disk", "camera", "video_camera", "movie_camera", "computer",
    "tv", "iphone", "phone", "telephone", "telephone_receiver", "pager", "fax",
    "minidisc", "vhs", "sound", "speaker", "mute", "loudspeaker", "mega",
    "hourglass", "hourglass_flowing_sand", "alarm_clock", "watch", "radio",
    "satellite", "loop", "mag", "mag_right", "unlock", "lock",
    "lock_with_ink_pen", "closed_lock_with_key", "key", "bulb", "flashlight",
    "high_brightness", "low_brightness", "electric_plug", "battery", "calling",
    "email", "mailbox", "postbox", "bath", "bathtub", "shower", "toilet",
    "wrench", "nut_and_bolt", "hammer", "seat", "moneybag", "yen", "dollar",
    "pound", "euro", "credit_card", "money_with_wings", "e-mail", "inbox_tray",
    "outbox_tray", "envelope", "incoming_envelope", "postal_horn",
    "mailbox_closed", "mailbox_with_mail", "mailbox_with_no_mail", "door",
    "smoking", "bomb", "gun", "hocho", "pill", "syringe", "page_facing_up",
    "page_with_curl", "bookmark_tabs", "bar_chart", "chart_with_upwards_trend",
    "chart_with_downwards_trend", "scroll", "clipboard", "calendar", "date",
    "card_index", "file_folder", "open_file_folder", "scissors", "pushpin",
    "paperclip", "black_nib", "pencil2", "straight_ruler", "triangular_ruler",
    "closed_book", "green_book", "blue_book", "orange_book", "notebook",
    "notebook_with_decorative_cover", "ledger", "books", "bookmark",
    "name_badge", "microscope", "telescope", "newspaper", "football",
    "basketball", "soccer", "baseball", "tennis", "8ball", "rugby_football",
    "bowling", "golf", "mountain_bicyclist", "bicyclist", "horse_racing",
    "snowboarder", "swimmer", "surfer", "ski", "spades", "hearts", "clubs",
    "diamonds", "gem", "ring", "trophy", "musical_score", "musical_keyboard",
    "violin", "space_invader", "video_game", "black_joker",
    "flower_playing_cards", "game_die", "dart", "mahjong", "clapper", "memo",
    "pencil", "book", "art", "microphone", "headphones", "trumpet", "saxophone",
    "guitar", "shoe", "sandal", "high_heel", "lipstick", "boot", "shirt",
    "tshirt", "necktie", "womans_clothes", "dress", "running_shirt_with_sash",
    "jeans", "kimono", "bikini", "ribbon", "tophat", "crown", "womans_hat",
    "mans_shoe", "closed_umbrella", "briefcase", "handbag", "pouch", "purse",
    "eyeglasses", "fishing_pole_and_fish", "coffee", "tea", "sake",
    "baby_bottle", "beer", "beers", "cocktail", "tropical_drink", "wine_glass",
    "fork_and_knife", "pizza", "hamburger", "fries", "poultry_leg",
    "meat_on_bone", "spaghetti", "curry", "fried_shrimp", "bento", "sushi",
    "fish_cake", "rice_ball", "rice_cracker", "rice", "ramen", "stew", "oden",
    "dango", "egg", "bread", "doughnut", "custard", "icecream", "ice_cream",
    "shaved_ice", "birthday", "cake", "cookie", "chocolate_bar", "candy",
    "lollipop", "honey_pot", "apple", "green_apple", "tangerine", "lemon",
    "cherries", "grapes", "watermelon", "strawberry", "peach", "melon",
    "banana", "pear", "pineapple", "sweet_potato", "eggplant", "tomato", "corn",
    "house", "house_with_garden", "school", "office", "post_office", "hospital",
    "bank", "convenience_store", "love_hotel", "hotel", "wedding", "church",
    "department_store", "european_post_office", "city_sunrise", "city_sunset",
    "japanese_castle", "european_castle", "tent", "factory", "tokyo_tower",
    "japan", "mount_fuji", "sunrise_over_mountains", "sunrise", "stars",
    "statue_of_liberty", "bridge_at_night", "carousel_horse", "rainbow",
    "ferris_wheel", "fountain", "roller_coaster", "ship", "speedboat", "boat",
    "sailboat", "rowboat", "anchor", "rocket", "airplane", "helicopter",
    "steam_locomotive", "tram", "mountain_railway", "bike", "aerial_tramway",
    "suspension_railway", "mountain_cableway", "tractor", "blue_car",
    "oncoming_automobile", "car", "red_car", "taxi", "oncoming_taxi",
    "articulated_lorry", "bus", "oncoming_bus", "rotating_light", "police_car",
    "oncoming_police_car", "fire_engine", "ambulance", "minibus", "truck",
    "train", "station", "train2", "bullettrain_front", "bullettrain_side",
    "light_rail", "monorail", "railway_car", "trolleybus", "ticket", "fuelpump",
    "vertical_traffic_light", "traffic_light", "warning", "construction",
    "beginner", "atm", "slot_machine", "busstop", "barber", "hotsprings",
    "checkered_flag", "crossed_flags", "izakaya_lantern", "moyai",
    "circus_tent", "performing_arts", "round_pushpin",
    "triangular_flag_on_post", "jp", "kr", "cn", "us", "fr", "es", "it", "ru",
    "gb", "uk", "de", "one", "two", "three", "four", "five", "six", "seven",
    "eight", "nine", "keycap_ten", "1234", "zero", "hash", "symbols",
    "arrow_backward", "arrow_down", "arrow_forward", "arrow_left",
    "capital_abcd", "abcd", "abc", "arrow_lower_left", "arrow_lower_right",
    "arrow_right", "arrow_up", "arrow_upper_left", "arrow_upper_right",
    "arrow_double_down", "arrow_double_up", "arrow_down_small",
    "arrow_heading_down", "arrow_heading_up", "leftwards_arrow_with_hook",
    "arrow_right_hook", "left_right_arrow", "arrow_up_down", "arrow_up_small",
    "arrows_clockwise", "arrows_counterclockwise", "rewind", "fast_forward",
    "information_source", "ok", "twisted_rightwards_arrows", "repeat",
    "repeat_one", "new", "top", "up", "cool", "free", "ng", "cinema", "koko",
    "signal_strength", "u5272", "u5408", "u55b6", "u6307", "u6708", "u6709",
    "u6e80", "u7121", "u7533", "u7a7a", "u7981", "sa", "restroom", "mens",
    "womens", "baby_symbol", "no_smoking", "parking", "wheelchair", "metro",
    "baggage_claim", "accept", "wc", "potable_water", "put_litter_in_its_place",
    "secret", "congratulations", "m", "passport_control", "left_luggage",
    "customs", "ideograph_advantage", "cl", "sos", "id", "no_entry_sign",
    "underage", "no_mobile_phones", "do_not_litter", "non-potable_water",
    "no_bicycles", "no_pedestrians", "children_crossing", "no_entry",
    "eight_spoked_asterisk", "eight_pointed_black_star", "heart_decoration",
    "vs", "vibration_mode", "mobile_phone_off", "chart", "currency_exchange",
    "aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra", "scorpius",
    "sagittarius", "capricorn", "aquarius", "pisces", "ophiuchus",
    "six_pointed_star", "negative_squared_cross_mark", "a", "b", "ab", "o2",
    "diamond_shape_with_a_dot_inside", "recycle", "end", "on", "soon", "clock1",
    "clock130", "clock10", "clock1030", "clock11", "clock1130", "clock12",
    "clock1230", "clock2", "clock230", "clock3", "clock330", "clock4",
    "clock430", "clock5", "clock530", "clock6", "clock630", "clock7",
    "clock730", "clock8", "clock830", "clock9", "clock930", "heavy_dollar_sign",
    "copyright", "registered", "tm", "x", "heavy_exclamation_mark", "bangbang",
    "interrobang", "o", "heavy_multiplication_x", "heavy_plus_sign",
    "heavy_minus_sign", "heavy_division_sign", "white_flower", "100",
    "heavy_check_mark", "ballot_box_with_check", "radio_button", "link",
    "curly_loop", "wavy_dash", "part_alternation_mark", "trident",
    "black_square", "white_square", "white_check_mark", "black_square_button",
    "white_square_button", "black_circle", "white_circle", "red_circle",
    "large_blue_circle", "large_blue_diamond", "large_orange_diamond",
    "small_blue_diamond", "small_orange_diamond", "small_red_triangle",
    "small_red_triangle_down", "shipit"
  ],
  rEmojis = new RegExp(":(" + emojis.join("|") + "):", "g");

  return {
    restrict: 'A',
    scope: {
      'content' : '@',
      'username' : '@'
    },
    replace: true,
    link: function (scope, element, attrs, controller) {
      var usernamePattern = new RegExp("(\@" + scope.username + ")", "gi");
      var unReplace = "<span class=\"mention\">$1</span>"

      //scope.$watch('content', function (value) {
        var text = escapeHtml(scope.content);
        /*scope.show_image = false;
        var images = text.replace(regex, to_replace);*/
        var new_text = text.replace(urlPattern, '<a target="_blank" href="$&">$&</a>');
        new_text = new_text.replace(rEmojis, function (match, text) {
                return "<i class='emoji emoji_" + text + "' title=':" + text + ":'>" + text + "</i>";
            });
        if(scope.username) {
          new_text = new_text.replace(usernamePattern, unReplace);
        }
        element.html(new_text);
      //});
    }
  };
}]);