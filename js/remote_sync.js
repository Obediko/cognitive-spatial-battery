/* Background, same-origin remote synchronization. No server secret is present in this file. */
'use strict';

window.BatteryRemoteSync = (function() {
  var active = location.protocol === 'https:' || location.hostname === 'localhost';
  var pending = Promise.resolve();
  var lastState = 'idle';
  var adminRemoteId = null;

  function bytesHex(bytes) {
    return Array.prototype.map.call(bytes, function(b) { return b.toString(16).padStart(2, '0'); }).join('');
  }
  function identityKey(participantId) {
    return 'csb-remote-v1:' + encodeURIComponent(String(participantId || ''));
  }
  function identity(participantId) {
    if (!participantId || !window.localStorage || !active) return null;
    var key = identityKey(participantId);
    try {
      var saved = JSON.parse(localStorage.getItem(key) || 'null');
      if (saved && saved.remoteId && saved.token) return saved;
    } catch (_) {}
    var created = {
      remoteId: crypto.randomUUID(),
      token: bytesHex(crypto.getRandomValues(new Uint8Array(32)))
    };
    localStorage.setItem(key, JSON.stringify(created));
    return created;
  }
  function request(url, options) {
    return fetch(url, Object.assign({ credentials: 'same-origin' }, options || {})).then(function(response) {
      if (!response.ok) return response.json().catch(function() { return {}; }).then(function(body) {
        throw new Error(body.error || ('Remote sync failed (' + response.status + ')'));
      });
      return response;
    });
  }
  function queue(job) {
    if (!active) return Promise.resolve(false);
    lastState = 'pending';
    pending = pending.catch(function() {}).then(job).then(function(value) {
      lastState = 'synced'; return value;
    }).catch(function(error) {
      lastState = 'failed';
      console.warn('Remote synchronization deferred:', error);
      return false;
    });
    return pending;
  }
  function queueCheckpoint(checkpoint) {
    if (!checkpoint || !checkpoint.participantId) return Promise.resolve(false);
    if (adminRemoteId) {
      return queue(function() {
        return request('/api/admin-sessions', {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: adminRemoteId, checkpoint: checkpoint })
        }).then(function() { return true; });
      });
    }
    var id = identity(checkpoint.participantId);
    if (!id) return Promise.resolve(false);
    return queue(function() {
      return request('/api/session-sync', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remoteId: id.remoteId, token: id.token, checkpoint: checkpoint })
      }).then(function() { return true; });
    });
  }
  function uploadArtifact(participantId, task, slot, blob) {
    var id = identity(participantId);
    if (!id || !blob || adminRemoteId) return Promise.resolve(false);
    return queue(function() {
      var form = new FormData();
      form.append('remoteId', id.remoteId);
      form.append('token', id.token);
      form.append('artifactKey', task + '/' + slot);
      form.append('file', blob, task + '-' + slot + '.webm');
      return request('/api/session-sync', { method: 'POST', body: form }).then(function() { return true; });
    });
  }
  return {
    queueCheckpoint: queueCheckpoint,
    uploadArtifact: uploadArtifact,
    flush: function() { return pending; },
    getStatus: function() { return lastState; },
    clearIdentity: function(participantId) {
      if (participantId && window.localStorage) localStorage.removeItem(identityKey(participantId));
    },
    setAdminRemoteId: function(value) { adminRemoteId = value || null; },
    enabled: active
  };
})();
