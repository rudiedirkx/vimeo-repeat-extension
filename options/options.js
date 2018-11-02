var $form;

function loadConfig() {
	return new Promise(function(resolve) {
		if (chrome.storage) {
			chrome.storage.local.get(['config'], function(items) {
				resolve(items.config || {});
			});
		}
		else {
			resolve({});
		}
	});
}

function saveConfig(config) {
	return new Promise(function(resolve, reject) {
		chrome.permissions.request({
			permissions: ['storage'],
		}, function(granted) {
			if ( granted && chrome.storage ) {
				chrome.storage.local.set({config}, function() {
					resolve();
				});
			}
			else {
				reject(chrome.runtime.lastError);
			}
		});
	});
}

function getConfigElements() {
	return [].slice.call(document.querySelectorAll('[data-save]'));
}

function setConfigs() {
	return loadConfig().then(config => {
		getConfigElements().map(item => {
			if (config[item.dataset.save] != null) {
				item.value = config[item.dataset.save];
			}
		});
	});
}

function enableForm() {
	document.querySelector('button').disabled = false;
}

function getConfigs() {
	return new Promise(function(resolve) {
		var config = getConfigElements().reduce(function(config, item) {
			config[item.dataset.save] = item.value;
			return config;
		}, {});
		resolve(config);
	});
}

function notifySaved() {
	$form.classList.add('saved');
	setTimeout(() => $form.classList.remove('saved'), 2000);
}

window.addEventListener('load', function(e) {
	$form = document.querySelector('form');

	$form.addEventListener('submit', function(e) {
		e.preventDefault();

		getConfigs().then(config => saveConfig(config)).then(notifySaved);
	});

	setConfigs().then(enableForm);
});
