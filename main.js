import Rivus from './rivus/rivus.js'

window.addEventListener('DOMContentLoaded', () => {
	document.querySelectorAll('[data-rivus]').forEach((el) => {
		new Rivus(el)
	})
})
