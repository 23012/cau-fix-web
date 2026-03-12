## 실행 방법

### `npm start`

개발 모드로 React 애플리케이션을 실행합니다.
터미널에서 `npm start`를 실행하면 개발 서버가 시작됩니다.

브라우저에서 아래 주소로 접속하면 실행 중인 웹 애플리케이션을 확인할 수 있습니다.

http://localhost:3000

코드를 수정하면 페이지가 자동으로 새로고침되며 변경 사항이 바로 반영됩니다.

나가기 : ctrl + c


### 외부 컴퓨터에서 실행 시

React 실행한 PC IP 주소를 포함한 주소 접속해야 합니다.

주의사항 : 같은 네트워크에 접속할 것

---

## Frontend 구조

`src` 폴더에는 React 애플리케이션의 주요 코드가 들어있습니다.
각 폴더의 역할은 다음과 같습니다.

```
src
 ├ components
 ├ pages
 ├ hooks
 ├ api
 ├ styles
 ├ assets
 ├ utils
 ├ App.js
 └ index.js
```

### index.js

React 애플리케이션의 **시작 파일(entry point)** 입니다.
React를 HTML의 `root` 요소에 렌더링하여 앱을 실행하는 역할을 합니다.

앱이 실행될 때 가장 먼저 실행되는 파일이며, `App.js` 컴포넌트를 브라우저에 표시합니다.

---

### App.js

React 애플리케이션의 **메인 컴포넌트**입니다.

전체 웹 페이지의 기본 구조를 구성하며 보통 다음과 같은 요소들을 포함합니다.

* Header
* Navigation
* 각 페이지 컴포넌트
* Router

즉, 실제 화면의 기본 레이아웃을 담당하는 파일입니다.

---

## 폴더

* `components` - UI 컴포넌트
* `pages` - 페이지 화면
* `api` - api 통신
* `hooks` - 재사용 로직
* `styles` - 전역 스타일
* `assets` - 정적 리소스

---

### components

여러 페이지에서 **재사용 가능한 UI 컴포넌트**를 저장하는 폴더입니다.

예시

* Header
* Footer
* Navbar
* Button

각 컴포넌트는 보통 다음과 같은 구조로 관리합니다.

```
components
 └ Header
     ├ Header.js
     └ Header.css
```

---

### pages

웹사이트의 **페이지 단위 컴포넌트**가 들어있는 폴더입니다.

예시

* Home
* Login
* Signup
* Dashboard

페이지는 여러 `components`를 조합하여 하나의 화면을 구성합니다.

---

### hooks

React의 **Custom Hook**을 관리하는 폴더입니다.

여러 컴포넌트에서 공통적으로 사용하는 로직을 Hook으로 만들어 재사용할 수 있습니다.

예시

* useAuth.js
* useFetch.js
* useWindowSize.js
* useLocalStorage.js

---

### api

백엔드 서버와 통신하는 **API 요청 코드**를 관리하는 폴더입니다.

보통 axios 또는 fetch를 사용하여 API 요청을 분리해 관리합니다.

예시

* axios.js (axios 설정)
* authApi.js
* userApi.js
* postApi.js

---

### styles

프로젝트 전체에서 사용하는 **전역 스타일 파일**을 관리하는 폴더입니다.

예시

* global.css (전체 공통 스타일)
* variables.css (색상, 폰트 등 CSS 변수)
* responsive.css (반응형 media query)

---

### assets

프로젝트에서 사용하는 **정적 파일**을 저장하는 폴더입니다.

예시

* 이미지
* 아이콘
* 폰트
* 로고

```
assets
 ├ images
 ├ icons
 └ fonts
```

---
