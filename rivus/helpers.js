// 헬퍼 함수 :: 속성값을 파싱하여 element, viewport 객체로 변환
export const parsePosition = (value) => {
	if (!value) return {element: null, viewport: null}
	const [element, viewport] = value.split(' ')
	return {element, viewport}
}

// 헬퍼함수 :: data-rivus-options 파싱
export const parseOptions = (element) => {
	const options = element.getAttribute('data-rivus-options')
	return options ? JSON.parse(options) : {}
}

// 헬퍼 함수 :: 위치 값을 픽셀로 변환
export const parsePositionValue = (value, size) => {
	if (!value) return 0

	// 픽셀 값 (예: "100px")
	if (value.endsWith('px')) {
		return parseFloat(value)
	}

	// 퍼센트값 계싼
	if (value.endsWith('%')) {
		const percent = parseFloat(value) / 100
		return size * percent
	}

	// 키워드 값 계산 (top, center, bottom)
	switch (value) {
		case 'top':
			return 0
		case 'center':
			return size / 2
		case 'bottom':
			return size
		default:
			return 0
	}
}

// 요소 위치 계산
export const getElementPosition = (boundingRect, position) => {
	const height = boundingRect.height
	const offset = parsePositionValue(position, height)
	return boundingRect.top + offset + window.scrollY
}

// 뷰포트 위치 계산
export const getViewportPosition = (position) => {
	const height = window.innerHeight
	return parsePositionValue(position, height)
}
