# Rivus

라틴어로 작은 강을 뜻하는 Rivus. 애니메이션 라이브러리 GSAP의 `ScrollTrigger`를 **Vanilla Javascript로 구현**했습니다.

## 설계

### 내가 느낀 GSAP ScrollTrigger의 문제점

GSAP의 ScrollTrigger는 아래와 같이 사용합니다.

```javascript
ScrollTrigger.create({
  trigger: ".element",
  start: "top top",
  end: "bottom top",
  scrub: 1,
  onEnter: () => {...},
  onUpdate: () => {...},
  // ... 그외 여러 속성
})
```

제가 느낀 `ScrollTrigger`의 문제점은 스타일이 `inline`으로 들어가서 기존에 작성한 CSS 스타일과의 충돌이 있었고, 또 리사이즈가 발생할 때마다 제어하기 어려웠습니다.

또, 다른 `.js`(`.ts`) 파일이나 `custom hook`으로 파일을 분리해도 복잡한 애니메이션을 구현하면 코드의 양과 길이가 길어져서 유지보수 측면에서 난이도가 있다는 것도 단점으로 생각했습니다.

### 어떻게 개선해야 할까? 어떻게 만들어야 쉽게 사용할 수 있을까?

#### 방법 1: GSAP처럼 자바스크립트로 제어하는 것을 그대로 가져가기

CSS로는 애니메이션을 제외한 스타일링만 선언하고, 애니메이션은 기존 GSAP처럼 `javascript`로 작성하는 방법입니다. 이 방법은 `transform: translateY(10px)`을 `y: '10px'`처럼 작성하는 것처럼 명시적으로 애니메이션 속성을 작성할 수 있는 게 장점입니다.

단점은 앞서 말씀 드린 것처럼 코드의 길이가 길어지고, 애니메이션이 복잡해질수록 섹션과 섹션이 이어지는 애니메이션을 구현할 때 어렵습니다.

(예를 들어 A -> B 섹션으로 이동 시 배경이 까맣게 되었다가, B -> C로 이동 시 배경이 하얗게 될 때, onEnter, onEnterBack, onLeave, onLeaveBack 함수를 다 작성해야 하는 문제점)

#### 방법 2: JAVASCRIPT + HTML + CSS로 애니메이션 주기

`javascript`보다 `css`로 애니메이션을 주는 것이 성능적으로 더 좋습니다. 무조건적으로 다 좋은 것은 아니지만 브라우저가 `layout → paint → composite` 순서대로 렌더링을 할 때, `transform`, `opacity` 같은 속성은 `layout`, `paint`를 건너뛰고 `composite` 단계만으로 처리할 수 있어서 훨씬 빠릅니다. 즉, 리플로우와 리페인드가 없고, 프레임 드랍이 적습니다. (`margin`, `width/height`, `border` 등 속성은 JS와 똑같이 성능이 무거워집니다.)

CSS 애니메이션을 많이, 그리고 잘 다뤄 본 사람은 `top`, `left`보다 `transform`을, `width`, `height`보다는 `scale`이 더 성능적인 측면에서 좋다는 것은 이미 알기 때문에 애니메이션을 잘 작성한다면 CSS만으로도 성능 저하 없는 애니메이션을 만들 수 있다고 생각합니다.

JS로는 `IntersectionObserver`를 작성하고, HTML로는 `data-set`을, CSS로는 애니메이션을 구현하는 방식으로 방법 2를 채택했습니다.

### 저는 이렇게 만들었어요!

#### HTML 구성

`data-set`으로 `Rivus`를 사용할 수 있게 구성했습니다.

```html
<div data-rivus data-rivus-start="top bottom" data-rivus-end="bottom bottom" data-rivus-enter="false" data-rivus-progress="0"></div>
```

`Rivus`를 사용하기 위해서는 `data-rivus`가 필수적입니다.

`data-rivus-start`와 `data-rivus-end`는 기존 `GSAP`의 `ScrollTrigger`와 동일하게 사용하도록 했습니다. 첫 번째 문자는 `element` 기준, 두 번째 문자열은 `viewport` 기준으로, **만약 `top bottom`이라고 되어 있을 시 요소의 `top` 부분이 `viewport`의 `bottom` 부분에 닿을 때 Rivus가 실행됩니다.**

`data-rivus-enter`는 요소가 `start`, `end` 값에 맞게 `viewport`에 들어왔을 시 `true`가 됩니다.

`dara-rivus-progress`는 요소가 `start`, `end` 값에 맞게 `viewport`에 들어왔을 시 0에서부터 1까지 `progress`가 올라가거나 감소됩니다.

#### Javascript 구성 - Helper 함수

먼저, 헬퍼 함수들을 `helpers.js`에 정의했습니다.

1. `parsePosition`

`data-set`으로 포지션을 `top top` 같은 문자열 (또는 `px`, `%` 단위)이 들어올 때 무엇이 element 기준인지, 또 무엇이 viewport 기준인지 처리해 줍니다.

```js
export const parsePosition = (value) => {
	if (!value) return {element: null, viewport: null}
	const [element, viewport] = value.split(' ')
	return {element, viewport}
}
```

`value`로 `top bottom`을 인자로 넣으면, 결과는 `{element: "top", viewport: "bottom"}`이 리턴됩니다.

2. `parseOptions`

```js
export const parseOptions = (element) => {
	const options = element.getAttribute('data-rivus-options')
	return options ? JSON.parse(options) : {}
}
```

아직은 쓰이지 않지만, 언젠가는 쓰일 `options` 객체를 자바스크립트에서 객체로 파싱해 줍니다.

```js
data-rivus-options={
  "otherOption": true
}
```

이런 식으로 하려고 했으나.. 아직까지는 어디에 쓰일지 좋은 아이디어가 떠올리지 않아서 지우지 않았습니다.

3. `parsePositionValue`

```js
export const parsePositionValue = (value, size) => {
	if (!value) return 0

	// 픽셀 값 (예: "100px")
	if (value.endsWith('px')) {
		return parseFloat(value)
	}

	// 퍼센트값 계산
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
```

스타트나 앤드값을 `top top` 또는 `20px 50%` 처럼 지정했을 시 `Number` 타입의 갑으로 반환합니다.

인자로는 `value`와 `size`값을 받는데, `value`는 `top`이나 `100px` 같은 `string` 타입으로 된 값을, `size`는 `element` 기준 `height`, `viewport`는 `innerHeight`를 받습니다.

3. `getElementPosition`, `getViewportPosition`

```js
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
```

요소의 위치를 계산하는 함수와 Viewport의 위치를 계산하는 헬퍼 함수입니다.

#### Javascript 구성 - IntersectionObsercer (Rivus 클래스)

Rivus는 스크롤 기반 애니메이션을 제어하는 클래스입니다. HTML에서 `data-rivus` 속성을 가진 요소를 감지하고, 스크롤 위치에 따라 progress를 업데이트합니다. Web API `intersectionObserver`를 활용했습니다.

- 생성자 (constructor)

```js
this.el = element

// 파싱된 옵션 저장
this.options = {
	start: parsePosition(element.dataset.rivusStart),
	end: parsePosition(element.dataset.rivusEnd),
	...this.parseOptions()
}

this.startScrollY = 0 // 스크롤이 시작되는 Y (progress 계산)
this.endScrollY = 0 // 스크롤이 끝나는 Y (progress 계산)
this.entered = false // 진입했는지 확인

this.onScroll = this.onScroll.bind(this)
this.computeProgress = this.computeProgress.bind(this)

this.init()
```

**동작 과정**

1. HTML 요소를 받아 `this.el`에 저장
2. `data-rivus-start`와 `data-rivus-end` 속성을 파싱하여 `options` 객체 생성
3. 스크롤 계산에 필요한 변수 초기화
4. `init()` 메서드를 호출하여 `IntersectionObserver` 설정

<br />

- `data-rivus-options`에 적힌 옵션 파싱

```js
  parseOptions() {
    const options = this.el.dataset.rivusOptions;
    return options ? JSON.parse(options) : {};
  }
```

- Progress 계산

```js
computeProgress() {
  const rect = this.el.getBoundingClientRect();

  const elementStart = getElementPosition(rect, this.options.start.element);
  const elementEnd = getElementPosition(rect, this.options.end.element);

  const viewportStart = getViewportPosition(this.options.start.viewport);
  const viewportEnd = getViewportPosition(this.options.end.viewport);

  this.startScrollY = elementStart - viewportStart;
  this.endScrollY = elementEnd - viewportEnd;
}
```

**동작 과정**

1. 요소의 height를 알기 위해 `getBoundingClientRect()`를 `rect` 변수에 저장
2. `getElementPosition`, `getViewportPosition` 헬퍼 함수를 통해 element와 viewport가 어디에서부터 시작되는지 확인
3. 스크롤이 시작되어야 하는 시작점(this.startScrollY)을 계산, 마찬가지로 스크롤이 끝나야 하는 시작점(this.endScrollY) 계산

**왜 이렇게 계산하나요?**

- `getBoundingClientRect().top`은 뷰포트 기준 상대 위치입니다
- 실제 스크롤 위치를 계산하려면 `window.scrollY`를 더해야 합니다
- `getElementPosition`과 `getViewportPosition`이 이를 처리합니다

**예시로 이해하기**

만약 `data-rivus-start="top bottom"`이고 `data-rivus-end="bottom bottom"`인 경우

1. `elementStart`: 요소의 top 위치 (페이지 기준 절대 위치)
2. `viewportStart`: 뷰포트의 bottom 위치 (뷰포트 높이)
3. `startScrollY`: elementStart - viewportStart = 요소의 top이 뷰포트 bottom에 닿는 스크롤 위치
4. `elementEnd`: 요소의 bottom 위치
5. `viewportEnd`: 뷰포트의 bottom 위치
6. `endScrollY`: elementEnd - viewportEnd = 요소의 bottom이 뷰포트 bottom에 닿는 스크롤 위치

<br />

- Scroll 이벤트

```js
  onScroll() {
    const scrollY = window.scrollY;

    // 진입
    if (
      !this.entered &&
      scrollY >= this.startScrollY &&
      scrollY <= this.endScrollY
    ) {
      this.entered = true;
      this.el.dataset.rivusEnter = "true";
    }

    // 이탈
    if (
      this.entered &&
      (scrollY < this.startScrollY || scrollY > this.endScrollY)
    ) {
      this.entered = false;
      this.el.dataset.rivusEnter = "false";
    }

    // progress 계산
    const progress =
      (scrollY - this.startScrollY) / (this.endScrollY - this.startScrollY);
    const clamped = Math.min(1, Math.max(0, progress));

    this.el.dataset.rivusProgress = clamped;
    this.el.style.setProperty("--progress", clamped);
  }
```

1. 진입 감지

- 요소가 아직 진입하지 않았고 (`!this.entered`)
- 현재 스크롤이 시작 위치와 끝 사이 위치에 있으면
- `this.entered`를 `true`로 변경하고, `data-rivus-enter="true"` 속성을 추가(변경)합니다.

2. 이탈 감지

- 요소가 진입한 상태이고 (`this.entered`)
- 스크롤 위치를 벗어나면
- `this.entered`를 `false`로 변경, `data-rivus-enter="false"` 속성을 변경합니다.

3. Progress 계산 및 업데이트

```js
// progress 계산
const progress = (scrollY - this.startScrollY) / (this.endScrollY - this.startScrollY)
const clamped = Math.min(1, Math.max(0, progress))

this.el.dataset.rivusProgress = clamped
this.el.style.setProperty('--progress', clamped)
```

- 진행도 계산: `(현재 스크롤 - 시작 위치) / (끝 위치 - 시작 위치)`
- `clamped`: 0과 1 사이로 제한
- `data-rivus-progress` 속성과 CSS 변수 --progress에 저장

<br />

- `IntersectionObserver` 사용으로 Element DOM 감지하기

```js
init() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        // 진입 시
        this.computeProgress(); // progress 계산
        this.onScroll();
        window.addEventListener("scroll", this.onScroll, { passive: true });
      } else {
        window.removeEventListener("scroll", this.onScroll);
      }
    });
  });

  observer.observe(this.el);
}
```

1. `IntersectionObserver`로 DOM 감지
2. `this.computedProgress()` 호출로 현재 레이아웃 상태에 맞춰 스크롤 기준점(startScrollY, endScrollY)를 다시 계산해야 하기 때문
3. 모든 요소에 스크롤 리스너를 등록하지 않고, 뷰포트에 보이는 요소만 감지하여 성능 최적화, 뷰포트를 벗어난 요소는 이벤트 리스너 제거
4. `passive: true`로 스크롤 성능 향상 (브라우저가 스크롤을 더 부드럽게 처리)
