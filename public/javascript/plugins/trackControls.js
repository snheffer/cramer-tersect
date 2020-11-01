Genoverse.Plugins.trackControls = function () {
  var defaultControls = [
    $('<a title="Refresh this track" class="fa fa-undo">').on('click', function(){
      //var instance = $("#genoverse").data("genoverse");
      //INITIALISE TRACK, AND THEN RESET IN THIS ORDER FOR REDRAWING
      //console.log($(this).data('track'));
      // for (var i in $(this).data("track").models){
      //   console.log(i)
      //   $(this).data("track").models[i].init()
      // }
      $(this).data("track").reset("completeSNPDensity");
    }),
    $('<a title="More info" class="fa fa-info-circle">').on('click', function () {
      var track = $(this).data('track');
      var menu  = track.prop('menus').filter('.gv-track-info');

      if (!menu.length) {
        menu = { title : track.name };
        menu[track.prop('info') || ''] = '';

        menu = track.prop('menus', track.prop('menus').add(track.browser.makeMenu(menu).addClass('gv-track-info')));
      }

      menu.show().position({ of: track.prop('container'), at: 'center top', my: 'center top', collision: 'none' });
    }),

    $([
      '<a class="gv-height-toggle">',
        '<i class="fa fa-sort"></i>',
        '<i class="fa fa-sort-desc"></i>',
        '<i class="fa fa-sort-asc"></i>',
      '</a>'
    ].join('')).on({
      click: function () {
        var track = $(this).data('track');
        var height;

        if (track.prop('autoHeight', !track.prop('autoHeight'))) {
          track.prop('heightBeforeToggle', track.prop('height'));
          height = track.prop('fullVisibleHeight');
        } else {
          height = track.prop('heightBeforeToggle') || track.prop('initialHeight');
        }

        $(this).trigger('toggleState');

        track.controller.resize(height, true);
      },
      toggleState: function () { // custom event to set title and change the icon
        var track      = $(this).data('track');
        var autoHeight = track.prop('autoHeight');
        var resizer    = track.prop('resizer');

        this.title = autoHeight ? 'Set track to fixed height' : 'Set track to auto-adjust height';
        $(this)[autoHeight ? 'addClass' : 'removeClass']('gv-auto-height');

        if (resizer) {
          resizer[autoHeight ? 'hide' : 'show']();
        }
      }
    })
  ];

  var binSizeSelector = $('<input type="number">').on('keypress', function (e) {
    if(e.which === 13){
      var instance = $("#genoverse").data("genoverse");
      if ($(this).val() >= Math.ceil((instance.end-instance.start)/10)){
        //$("#genoverse").data("master_binSize", $(this).val());
        $("#genoverse").data('binSize_'+$(this).data("track")._defaults.model.prototype.binSize_id, $(this).val());

        console.log($(this).data("track"));

        $(this).data('track').reset("completeSNPDensity");
      } else {
        window.alert('That Binsize Value is Too Great For The Current Zoom Level')
      }
      //Disable textbox to prevent multiple submit
      $(this).attr("disabled", "disabled");
      //Enable the textbox again if needed.
      $(this).removeAttr("disabled");
    }
  });
  //($(this).data('track').namespace == 'SNPDensity'? binSizeSelector : []),

  var remove = $('<a title="Remove track" class="fa fa-trash">').on('click', function () {
    $(this).data('track').remove();
  });

  var toggle = $([
    '<a class="gv-track-controls-toggle">',
      '<span><i class="fa fa-angle-double-left"></i><i class="fa fa-cog"></i></span>',
      '<span><i class="fa fa-angle-double-right"></i></span>',
    '</a>'
  ].join('')).on('click', function () {
    $(this).parent().toggleClass('gv-maximized');
  });

  this.on({
    afterAddDomElements: function () {
      var controls = this.prop('controls');

      if (controls === 'off') {
        return;
      }

      var defaultConfig = this.prop('defaultConfig');
      var savedConfig   = this.browser.savedConfig ? this.browser.savedConfig[this.prop('id')] || {} : {};
      var prop, el, j;
      var namespace = this.model.track.namespace ? this.model.track.namespace : null;

      controls = (controls || []).concat((namespace === "SNPDensity" ? binSizeSelector : []), defaultControls, this.prop('removable') === false ? [] : remove);

      this.trackControls = $('<div class="gv-track-controls">').prependTo(this.container);

      var controlsContainer = $('<div class="gv-track-controls-container">').appendTo(this.trackControls);

      for (var i = 0; i < controls.length; i++) {
        if ($.isPlainObject(controls[i]) && controls[i].type) {
          el = $('<' + controls[i].type + '>').data('control', controls[i].name);

          if (controls[i].options) {
            for (j = 0; j < controls[i].options.length; j++) {
              el.append('<option value="' + controls[i].options[j].value + '">' + controls[i].options[j].text + '</option>');
            }
          }
        } else if (typeof controls[i] === 'string') {
          el = $(controls[i]);
        } else if (typeof controls[i] === 'object' && controls[i].constructor && controls[i] instanceof $) {
          el = controls[i].clone(true);
        }

        el.data('track', this.track).appendTo(controlsContainer);

        // TODO: other control types
        if (el.is('select')) {
          prop = el.data('control');

          el.find('option[value=' + (savedConfig[prop] || defaultConfig[prop] || 'all') + ']').attr('selected', true).end().change(function () {
            $(this).data('track').setConfig($(this).data('control'), this.value);
          });
        }
      }

      this.prop('heightToggler', controlsContainer.children('.gv-height-toggle').trigger('toggleState'));

      var toggler = toggle.clone(true).data('track', this.track).appendTo(this.trackControls);

      toggler.trigger('click');
      this.minLabelHeight = Math.max(this.minLabelHeight, this.trackControls.outerHeight(true) + this.prop('margin'));
      toggler.trigger('click');

    },
    afterResize: function () {
      if (this.trackControls) {
        this.trackControls[this.prop('height') < this.trackControls.outerHeight(true) ? 'hide' : 'show']();
      }
    },
    afterResetHeight: function () {
      var heightToggler = this.prop('heightToggler');

      if (this.prop('resizable') === true && heightToggler) {
        heightToggler[this.prop('autoHeight') ? 'addClass' : 'removeClass']('gv-auto-height');
        heightToggler.trigger('toggleState');
      }
    },
    afterSetMVC: function () {
      var heightToggler = this.prop('heightToggler');

      if (heightToggler) {
        heightToggler.trigger('toggleState')[this.prop('resizable') === true ? 'removeClass' : 'addClass']('gv-hide');
      }
    }
  }, 'tracks');
};