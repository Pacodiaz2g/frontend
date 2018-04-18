/* eslint-disable */
export const glue=function(e,n){"use strict";function t(e){return e?o(e):void 0}function o(e){for(var n in t.prototype)e[n]=t.prototype[n];return e}"undefined"!=typeof module&&(module.exports=t),t.prototype.on=t.prototype.addEventListener=function(e,n){return this._callbacks=this._callbacks||{},(this._callbacks["$"+e]=this._callbacks["$"+e]||[]).push(n),this},t.prototype.once=function(e,n){function t(){this.off(e,t),n.apply(this,arguments)}return t.fn=n,this.on(e,t),this},t.prototype.off=t.prototype.removeListener=t.prototype.removeAllListeners=t.prototype.removeEventListener=function(e,n){if(this._callbacks=this._callbacks||{},0===arguments.length)return this._callbacks={},this;var t=this._callbacks["$"+e];if(!t)return this;if(1==arguments.length)return delete this._callbacks["$"+e],this;for(var o,i=0;i<t.length;i++)if(o=t[i],o===n||o.fn===n){t.splice(i,1);break}return this},t.prototype.emit=function(e){this._callbacks=this._callbacks||{};var n=[].slice.call(arguments,1),t=this._callbacks["$"+e];if(t){t=t.slice(0);for(var o=0,i=t.length;i>o;++o)t[o].apply(this,n)}return this},t.prototype.listeners=function(e){return this._callbacks=this._callbacks||{},this._callbacks["$"+e]||[]},t.prototype.hasListeners=function(e){return!!this.listeners(e).length};var i,c,r,s,a,u,l,f,d=function(){var t,o={};return o.open=function(){try{var i;i=e.match("^https://")?"wss"+e.substr(5):"ws"+e.substr(4),i+=n.baseURL+"ws",t=new WebSocket(i),t.onmessage=function(e){o.onMessage(e.data.toString())},t.onerror=function(e){var n="the websocket closed the connection with ";n+=e.code?"the error code: "+e.code:"an error.",o.onError(n)},t.onclose=function(){o.onClose()},t.onopen=function(){o.onOpen()}}catch(c){o.onError()}},o.send=function(e){t.send(e)},o.reset=function(){t&&t.close(),t=void 0},o},h=function(){var t,o,i,c=e+n.baseURL+"ajax",r=8e3,s=45e3,a={Timeout:"t",Closed:"c"},u={Delimiter:"&",Init:"i",Push:"u",Poll:"o"},l={},f=!1,d=!1,h=function(){i=function(){},f&&f.abort(),d&&d.abort()},v=function(e,n,t,o,i){var c=window.XMLHttpRequest?new XMLHttpRequest:new ActiveXObject("Microsoft.XMLHTTP");return c.onload=function(){o(c.response)},c.onerror=function(){i()},c.ontimeout=function(){i("timeout")},c.open("POST",e,!0),c.responseType="text",c.timeout=n,c.send(t),c},g=function(){h(),l.onClose()},p=function(e){h(),e=e?"the ajax socket closed the connection with the error: "+e:"the ajax socket closed the connection with an error.",l.onError(e)},m=function(e,n){d=v(c,r,e,function(e){d=!1,n&&n(e)},function(e){d=!1,p(e)})};return i=function(){var e=u.Poll+t+u.Delimiter+o;f=v(c,s,e,function(e){if(f=!1,e==a.Timeout)return void i();if(e==a.Closed)return void g();var n=e.indexOf(u.Delimiter);return 0>n?void p("ajax socket: failed to split poll token from data!"):(o=e.substring(0,n),e=e.substr(n+1),i(),void l.onMessage(e))},function(e){f=!1,p(e)})},l.open=function(){m(u.Init,function(e){var n=e.indexOf(u.Delimiter);return 0>n?void p("ajax socket: failed to split uid and poll token from data!"):(t=e.substring(0,n),o=e.substr(n+1),i(),void l.onOpen())})},l.send=function(e){m(u.Push+t+u.Delimiter+e)},l.reset=function(){h()},l},v="1.9.1",g="m",p={WebSocket:"WebSocket",AjaxSocket:"AjaxSocket"},m={Len:2,Init:"in",Ping:"pi",Pong:"po",Close:"cl",Invalid:"iv",DontAutoReconnect:"dr",ChannelData:"cd"},b={Disconnected:"disconnected",Connecting:"connecting",Reconnecting:"reconnecting",Connected:"connected"},k={baseURL:"/glue/",forceSocketType:!1,connectTimeout:1e4,pingInterval:35e3,pingReconnectTimeout:5e3,reconnect:!0,reconnectDelay:1e3,reconnectDelayMax:5e3,reconnectAttempts:10,resetSendBufferTimeout:1e4},y=new t,D=!1,T=!1,w=b.Disconnected,x=0,M=!1,L=!1,S=!1,C=!1,_=[],R=!1,O=!1,I=!1,P=[],j="",A=function(){var e="&",n={};return n.extend=function(){for(var e=1;e<arguments.length;e++)for(var n in arguments[e])arguments[e].hasOwnProperty(n)&&(arguments[0][n]=arguments[e][n]);return arguments[0]},n.isFunction=function(e){var n={};return e&&"[object Function]"===n.toString.call(e)},n.unmarshalValues=function(n){if(!n)return!1;var t=n.indexOf(e),o=parseInt(n.substring(0,t),10);if(n=n.substring(t+1),0>o||o>n.length)return!1;var i=n.substr(0,o),c=n.substr(o);return{first:i,second:c}},n.marshalValues=function(n,t){return String(n.length)+e+n+t},n}(),U=function(){var e={},n={},t=function(e){var n={onMessageFunc:function(){}};return n.instance={onMessage:function(e){n.onMessageFunc=e},send:function(n,t){return n?u(m.ChannelData,A.marshalValues(e,n),t):-1}},n};return e.get=function(e){if(!e)return!1;var o=n[e];return o?o.instance:(o=t(e),n[e]=o,o.instance)},e.emitOnMessage=function(e,t){if(e&&t){var o=n[e];if(!o)return void console.log("glue: channel '"+e+"': emit onMessage event: channel does not exists");try{o.onMessageFunc(t)}catch(i){return void console.log("glue: channel '"+e+"': onMessage event call failed: "+i.message)}}},e}();a=function(e){return D?I?void D.send(e):void P.push(e):void 0};var E=function(){if(0!==P.length){for(var e=0;e<P.length;e++)a(P[e]);P=[]}},F=function(){O=!1,R!==!1&&(clearTimeout(R),R=!1)},q=function(){R!==!1||O||(R=setTimeout(function(){if(R=!1,O=!0,0!==_.length){for(var e,n=0;n<_.length;n++)if(e=_[n],e.discardCallback&&A.isFunction(e.discardCallback))try{e.discardCallback(e.data)}catch(t){console.log("glue: failed to call discard callback: "+t.message)}f("discard_send_buffer"),_=[]}},n.resetSendBufferTimeout))},W=function(){if(F(),0!==_.length){for(var e,n=0;n<_.length;n++)e=_[n],a(e.cmd+e.data);_=[]}};u=function(e,n,t){return n||(n=""),D&&w===b.Connected?(a(e+n),1):O?(t&&A.isFunction(t)&&t(n),-1):(q(),_.push({cmd:e,data:n,discardCallback:t}),0)};var $=function(){L!==!1&&(clearTimeout(L),L=!1)},V=function(){$(),L=setTimeout(function(){L=!1,f("connect_timeout"),l()},n.connectTimeout)},X=function(){S!==!1&&(clearTimeout(S),S=!1),C!==!1&&(clearTimeout(C),C=!1)},H=function(){X(),S=setTimeout(function(){S=!1,a(m.Ping),C=setTimeout(function(){C=!1,f("timeout"),l()},n.pingReconnectTimeout)},n.pingInterval)},z=function(){return T?void(D=c()):x>1?(c=h,D=c(),void(r=p.AjaxSocket)):(!n.forceSocketType&&window.WebSocket||n.forceSocketType===p.WebSocket?(c=d,r=p.WebSocket):(c=h,r=p.AjaxSocket),void(D=c()))},B=function(e){return e=JSON.parse(e),e.socketID?(j=e.socketID,I=!0,E(),w=b.Connected,f("connected"),void setTimeout(W,0)):(s(),void console.log("glue: socket initialization failed: invalid initialization data received"))},J=function(){z(),D.onOpen=function(){$(),x=0,T=!0,H();var e={version:v};e=JSON.stringify(e),D.send(m.Init+e)},D.onClose=function(){l()},D.onError=function(e){f("error",[e]),l()},D.onMessage=function(e){if(H(),e.length<m.Len)return void console.log("glue: received invalid data from server: data is too short.");var n=e.substr(0,m.Len);if(e=e.substr(m.Len),n===m.Ping)a(m.Pong);else if(n===m.Pong);else if(n===m.Invalid)console.log("glue: server replied with an invalid request notification!");else if(n===m.DontAutoReconnect)M=!0,console.log("glue: server replied with an don't automatically reconnect request. This might be due to an incompatible protocol version.");else if(n===m.Init)B(e);else if(n===m.ChannelData){var t=A.unmarshalValues(e);if(!t)return void console.log("glue: server requested an invalid channel data request: "+e);U.emitOnMessage(t.first,t.second)}else console.log("glue: received invalid data from server with command '"+n+"' and data '"+e+"'!")},setTimeout(function(){x>0?(w=b.Reconnecting,f("reconnecting")):(w=b.Connecting,f("connecting")),V(),D.open()},0)},N=function(){$(),X(),I=!1,j="",P=[],D&&(D.onOpen=D.onClose=D.onMessage=D.onError=function(){},D.reset(),D=!1)};if(l=function(){if(N(),n.reconnectAttempts>0&&x>n.reconnectAttempts||n.reconnect===!1||M)return w=b.Disconnected,void f("disconnected");x+=1;var e=n.reconnectDelay*x;e>n.reconnectDelayMax&&(e=n.reconnectDelayMax),setTimeout(function(){J()},e)},s=function(){D&&(a(m.Close),N(),w=b.Disconnected,f("disconnected"))},i=U.get(g),e||(e=window.location.protocol+"//"+window.location.host),!e.match("^http://")&&!e.match("^https://"))return void console.log("glue: invalid host: missing 'http://' or 'https://'!");n=A.extend({},k,n),n.reconnectDelayMax<n.reconnectDelay&&(n.reconnectDelayMax=n.reconnectDelay),0!==n.baseURL.indexOf("/")&&(n.baseURL="/"+n.baseURL),"/"!==n.baseURL.slice(-1)&&(n.baseURL=n.baseURL+"/"),J();var G={version:function(){return v},type:function(){return r},state:function(){return w},socketID:function(){return j},send:function(e,n){i.send(e,n)},onMessage:function(e){i.onMessage(e)},on:function(){y.on.apply(y,arguments)},reconnect:function(){w===b.Disconnected&&(x=0,M=!1,l())},close:function(){s()},channel:function(e){return U.get(e)}};return f=function(){y.emit.apply(y,arguments)},G};