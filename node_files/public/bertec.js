/*
 * This is a modified version of the common COPfield class that Bertec ships with Bertec Workbook and Bertec Balance Advantage.
 * Both of those applications use an embedded web browser forked from WebKit as their main user interface and report surface.
 * This JS library provides functionality to create and display a simple Center of Pressure with a movable target icon that
 * can be controlled by either AJAX calls (from with BW or BBA) or via using WebSockets events responding to JSON objects.
 * If using the embedded WebKit with the appropriate exposed Test and WB objects, you can use COPfield.startCOPpolling() to update
 * the cursor either via AJAX or direct object calls (don't do this if you're using this in a stand-alone browser).
 * To use this with WebSockets and the SpartaBertecFP server, you must NOT use cop polling and instead directly
 * set the cursor via COPfield.positionTargetCursor(fz, copx, copy) from your WebSocket.onmessage handler.
 */

//////////////////////////////////////////////////////////////////////////
// COPfield element

var COPfield = {
   name: "COPfield",
   copField: null,
   copFieldContainer: null,
   pressureMarker: null,
   traceCanvas: null,
   traceCanvasCtx: null,
   orgWidth: 0, orgHeight: 0, orgMarkerWidth: 0, orgMarkerHeight: 0, // used for scaling
   cursorImage: "crosshair_black.png",
   cursorScalingFactor: 500,
   copScalingX: 4,
   copScalingY: 4,
   copXOffsetM: 0, // these are applied to the COP/COG values before processing by compute.
   copYOffsetM: 0,
   cursorOffsetX: 0,
   cursorOffsetY: 0,
   clampLimits: true,
   showCursor: true,
   showTrace: false,
   docWidth: 0,
   docHeight: 0,
   pageResized: function()
   {
      var browserDims = document.body.getDimensions();
      COPfield.docWidth = browserDims.width;
      COPfield.docHeight = browserDims.height;
   },
   attach: function(field, container, redrawex)
   {
      this.pageResized();
      Event.observe(window, 'resize', this.pageResized.bind(this));

      if (redrawex != undefined)
         this.redrawex = redrawex;

      this.copField = field;
      this.copFieldContainer = container;

      if (this.showTrace == true)
      {
		  console.log('dsdsd');
         var coplayout = this.copField.getLayout();
         var w = coplayout.get("width");
         var h = coplayout.get("height");

         // Check if the field is non-static; if static, make it relative so that this works.
         var s = Element.getStyle(this.copField, 'position');
         if (s == "" || s == "static")
            Element.relativize(this.copField);

         s = "<canvas id='cop_trace_canvas' width='" + w + "' height='" + h + "' style='position:absolute;left:0px;top:0px'></canvas>";
         this.copField.insert({ top: s });
         this.traceCanvas = $("cop_trace_canvas");

         this.resizeTraceArea(w, h);

         //  this.traceCanvasCtx = this.traceCanvas.getContext('2d');
         // 
         //  // Makes the test block red so I can see it.
         //  this.traceCanvasCtx.fillStyle = "#FF0000";
         //  this.traceCanvasCtx.fillRect(0, 0, w, h);
         // 
         //  this.traceCanvasCtx.lineWidth = 1;
         //  this.traceCanvasCtx.strokeStyle = "#999999";
      }

      $$("body")[0].insert({ top: "<img id='cop_marker' class='cop_marker' src='" + this.cursorImage + "'>" });
      this.pressureMarker = $("cop_marker");

      //  $$("body")[0].insert("<img id='cop_marker2' class='cop_marker' src='crosshair.png' style='background:red'>");   // should be able to change this.
      //  this.pressureMarker2 = $("cop_marker2");

      // we can't get the size until it's loaded, and that will happen as the page is rendered
      this.pressureMarker.onload = function()
      {
         COPfield.orgMarkerWidth = this.width;
         COPfield.orgMarkerHeight = this.height;
         COPfield.resizeCursor();
      };

      this.redraw();
   },
   resizeTraceArea: function(w, h)
   {
      if (this.traceCanvas != null)
      {
         this.traceCanvas.width = w;
         this.traceCanvas.height = h;
         this.traceCanvasCtx = this.traceCanvas.getContext('2d');

         // Makes the test block red so I can see it.
         //this.traceCanvasCtx.fillStyle = "#FF0000";
         //this.traceCanvasCtx.fillRect(0, 0, w, h);

         this.traceCanvasCtx.lineWidth = 1;
         this.traceCanvasCtx.strokeStyle = "#999999";
      }
   },
   create: function(containercell, width, height, redrawex)
   {
      this.orgWidth = width;  // used when going in/out of fs mode
      this.orgHeight = height;

      var htm = "<div id='cop_disp_outer' style='position: relative; width: " + width + "px; height: " + height + "px;'>";
      htm += "<canvas id='cop_disp' width='" + width + "' height='" + height + "' style='position: absolute; top:0; left:0; width: 100%; height: 100%;'></canvas>";
      htm += "</div>";

      $(containercell).insert(htm);

      this.attach($("cop_disp"), $("cop_disp_outer"), redrawex);
   },
   targetCursorPositionChanged: null,
   targetCursorHidden: null,
   positionTargetCursor: function(fz, copx, copy)
   {
      this.positionTargetCursor_c(this.pressureMarker, fz, copx, copy);
   },
   computeTargetCursorPosition: function(boxW, boxH, fz, copx, copy)
   {
      var sw = boxW / 2.0;
      var sh = boxH / 2.0;
      var sx = (sw + (copx * this.copScalingX * sw));
      var sy = (sh + (copy * this.copScalingY * sh));
      return { sx: sx, sy: sy };
   },
   positionTargetCursor_c: function(pressureMarker, fz, copx, copy)
   {
      // For the training, unlike everything else, we do 20 newtons instead of 10.
      if (fz > 20.0)
      {
         var coplayout = this.copField.getLayout();
         var copoffset = this.copField.cumulativeOffset();

         // position the cursor on the screen; this is scaled to fit the box
         var w = coplayout.get("width");
         var h = coplayout.get("height");
         var m = this.computeTargetCursorPosition(w, h, fz, copx + this.copXOffsetM, copy + this.copYOffsetM);

         var x = m.sx + (copoffset.left - (pressureMarker.width / 2)) + this.cursorOffsetX;
         var y = m.sy + (copoffset.top - (pressureMarker.height / 2)) + this.cursorOffsetY;
         if (this.clampLimits)
         {
            if (x < copoffset.left)
               x = copoffset.left;
            if (x > copoffset.left + w)
               x = copoffset.left + w;
            if (y < copoffset.top)
               y = copoffset.top;
            if (y > copoffset.top + h)
               y = copoffset.top + h;
         }
         if (x < 0 || y < 0 || (x + pressureMarker.width) >= this.docWidth || (y + pressureMarker.height) >= this.docHeight)
         {
            pressureMarker.style.left = pressureMarker.width;
            pressureMarker.style.top = pressureMarker.height;
            pressureMarker.style.visibility = 'hidden';  // we don't want to trigger the hidden function, just don't want the browser scrollbars to show up
         }
         else
         {
            if (this.traceCanvasCtx != null)
            {
               if (pressureMarker.style.visibility == 'visible')
               {
                  this.traceCanvasCtx.moveTo(pressureMarker.lastM.sx + this.cursorOffsetX, pressureMarker.lastM.sy + this.cursorOffsetY);
                  this.traceCanvasCtx.lineTo(m.sx + this.cursorOffsetX, m.sy + this.cursorOffsetY);
                  this.traceCanvasCtx.stroke();
               }
               pressureMarker.lastM = m;
            }

            pressureMarker.style.left = x + "px";
            pressureMarker.style.top = y + "px";
            if (this.showCursor)
               pressureMarker.style.visibility = 'visible';
            else
               pressureMarker.style.visibility = 'hidden';
         }

         if (this.targetCursorPositionChanged != undefined)
            this.targetCursorPositionChanged(x + (pressureMarker.width / 2), y + (pressureMarker.height / 2), copx, copy, m.sx, m.sy);
      }
      else
      {
         if (pressureMarker.style.visibility != 'hidden')
         {
            pressureMarker.style.visibility = 'hidden';
            if (this.targetCursorHidden != undefined)
               this.targetCursorHidden();
         }
      }
   },
   // the polling works best by re-issuing setTimeout so that if the handling code takes too long the webkit system doesn't barf
   // (because if we are processing a LOT in the positionTargetCursor, then we can get an event in the middle of the onSuccess event).
   copPollcenterOfGravity: false, // set true to use center of gravity instead of center of pressure (cog vs cop)
   copPollingVariable: null,
   copSwapXYvalues: false,
   useAjaxPolling: false, // set this to true in order to use the HTML ajax callback; that involves more overhead, but can be used remotely
   startCOPpolling: function()
   {
      this.stopCOPpolling();
      this.copPollingVariable = setTimeout(function()
      {
         COPfield.copPollingVariable = null;
         if (COPfield.useAjaxPolling)
         {
            var pollwhat = "$cop";  // center of pressure
            if (COPfield.copPollcenterOfGravity)
               pollwhat = "$cog";
            new Ajax.Request(pollwhat,
                    {
                       method: 'get',
                       onSuccess: function(transport)
                       {
                          var o = transport.responseText.evalJSON();
                          if (("x" in o) && ("y" in o) && ("z" in o))
                          {
                             if (COPfield.copSwapXYvalues)
                                COPfield.positionTargetCursor(o.z, o.y, o.x);
                             else
                                COPfield.positionTargetCursor(o.z, o.x, o.y);
                          }
                          setTimeout(function() { COPfield.startCOPpolling(); }, 15);
                          //COPfield.startCOPpolling.defer();   // let it occur during the next available cycle; otherwise we blow up the web browser
                          // this doesn't seem to work any more, so we hand-craft it what it's supposed to be doing; we also account for this 15 ms below, too
                       }
                    });
         }
         else
         {
            var data = Test.CurrentChannelData;
            var x = 0, y = 0;
            var f = false;
            if (COPfield.copPollcenterOfGravity)
            {
               if (("cogx" in data) && ("cogy" in data))
               {
                  f = true;
                  x = data.cogx;
                  y = data.cogy;
               }
            }
            else
            {
               if (("copx" in data) && ("copy" in data))
               {
                  f = true;
                  x = data.copx;
                  y = data.copy;
               }
            }

            if (!f || !("fz" in data))
            {
               // this test doesn't directly capture the copx/y values, so we need to fall back into the Ajax polling method
               COPfield.useAjaxPolling = true;
               WB.Debug("Falling back to ajax");
            }
            else
            {
               if (COPfield.copSwapXYvalues)
                  COPfield.positionTargetCursor(data.fz, y, x);
               else
                  COPfield.positionTargetCursor(data.fz, x, y);
            }
            COPfield.startCOPpolling();
         }
      }, (1000 / 50) - (COPfield.useAjaxPolling ? 15 : 0));
   },
   stopCOPpolling: function()
   {
      clearTimeout(this.copPollingVariable);
      this.copPollingVariable = null;
   },
   donotredraw: false,
   redrawex: function(ctx, midpointoptions)
   {
   },
   redraw: function()
   {
      if (this.copField != null && !this.donotredraw && this.copField.getContext != undefined)
      {
         var wid = this.copField.width;
         var hei = this.copField.height;
         var ctx = this.copField.getContext('2d');
         ctx.save();
         //   ctx.globalCompositeOperation = 'destination-over';
         ctx.clearRect(0, 0, wid, hei);
         ctx.strokeStyle = "#999999";
         ctx.beginPath();
         // draw front-to-back
         ctx.moveTo(wid / 2, 0);
         ctx.lineTo(wid / 2, hei);
         // draw the left-to-right, and offset it 2/5 from the bottom
         var offset = hei - (hei * 0.4);
         ctx.moveTo(0, offset);
         ctx.lineTo(wid, offset);
         ctx.stroke();

         ctx.beginPath();
         ctx.moveTo(1, 1);
         ctx.lineTo(wid - 1, 1);
         ctx.lineTo(wid - 1, hei - 1);
         ctx.lineTo(1, hei - 1);
         ctx.lineTo(1, 1);
         ctx.stroke();

         var midpointoptions = { cx: wid / 2, cy: offset, width: wid, height: hei };
         if (this.redrawex != undefined)
            this.redrawex(ctx, midpointoptions);
         ctx.restore();
         return midpointoptions;
      }
   },
   callredrawex: function(_exopt)
   {
      if (this.copField != null)
      {
         var ctx = this.copField.getContext('2d');
         ctx.save();
         var wid = this.copField.width;
         var hei = this.copField.height;
         var offset = hei - (hei * 0.4);
         var midpointoptions = { cx: wid / 2, cy: offset, width: wid, height: hei, exopt: _exopt };
         if (this.redrawex != undefined)
            this.redrawex(ctx, midpointoptions);
         ctx.restore();
      }
   },
   resizeCursor: function()
   {
      // The cursor was originally designed for a 500 x 500 field, so we need to hard-code that value here
      if (this.copField != null && this.cursorScalingFactor != 0)
      {
         var scaleX = this.cursorScalingFactor / this.orgMarkerWidth;
         var scaleY = this.cursorScalingFactor / this.orgMarkerHeight;

         var coplayout = this.copField.getLayout();

         var w = Math.ceil(coplayout.get("width") / scaleX);
         var h = Math.ceil(coplayout.get("height") / scaleY);
         this.pressureMarker.style.width = w;
         this.pressureMarker.style.height = h;
      }
   },
   fullScreenModeChanged: function(newMode)
   {
      var w = this.orgWidth;  // by default set it to the original size
      var h = this.orgHeight;

      if (newMode == true)
      {
         // we want to keep the original scaling factor, so we need to ask for 100% of the container's size and then get the layout
         // note that the max height depends on the table's height value - we will probably want to re-do that as divs and spans.
         if (this.copFieldContainer != null)
         {
            var ratio = w / h;
            this.copFieldContainer.style.height = '100%';
            var layout = this.copFieldContainer.getLayout(true);
            h = layout.get('height');  // should be in px
            w = h * ratio;
         }
      }

      w += "px";
      h += "px";
      if (this.copFieldContainer != null)
      {
         this.copFieldContainer.style.width = w
         this.copFieldContainer.style.height = h;
      }

      if (this.copField != null)
      {
         this.copField.style.width = w;
         this.copField.style.height = h;
      }

      COPfield.resizeCursor();
      COPfield.redraw();
   }
};

console.log(3);
