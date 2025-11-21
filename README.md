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
