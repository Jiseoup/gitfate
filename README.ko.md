# gitfate

[English](README.md) | **한국어**

깃허브 가입 시각으로 보는 개발자 사주.

gitfate는 GitHub에 가입한 순간을 개발자로 태어난 시각으로 보고, 사주를 풀듯 읽어서 「거목」부터 「빗방울」까지 열 가지 개발자 유형 중 어디에 속하는지 알려 줘요. 오늘의 운세, 올해 운세, 개발 궁합까지 개발자 밈으로 풀어 드려요. 재미로 보는 프로젝트이고, 한국어와 영어를 지원해요.

**바로 보기: [gitfate.vercel.app](https://gitfate.vercel.app/ko)**. 로그인도, 설치도 필요 없어요.

<a href="https://gitfate.vercel.app/ko/Jiseoup">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://gitfate.vercel.app/api/card/natal/ko/Jiseoup.png?theme=github-dark">
    <img alt="gitfate 타고난 사주 카드" src="https://gitfate.vercel.app/api/card/natal/ko/Jiseoup.png?theme=github-light">
  </picture>
</a>

## 볼 수 있는 것

`https://gitfate.vercel.app/ko/<내 아이디>`를 열면 돼요(영어는 `/en/<내 아이디>`).

- **타고난 사주**: 나의 개발자 유형("<이름>님은 「보석」 개발자"), GitHub 가입일과 깃허브 나이, 가입 시각의 네 기둥(오행 색의 유형 아이콘), 띠.
- **오늘의 운세**: 운세 점수, 오늘의 역할(테스트 수호자, 장애 대응 사령관 등), 배포·디버깅·코드리뷰·머지 운 별점, 고대 달력이 말하는 하면 좋은 일과 피할 일(개발 활동으로 번역). 현지 시각 자정에 바뀌어요.
- **올해 운세**: 올해의 유형과 역할, 월별 운세와 실제 기여 수 비교. 사주에서 한 해는 1월 1일이 아니라 입춘(2월 4일 무렵)에 시작해요.
- **개발 궁합**: `/<언어>/<아이디>/vs/<상대 아이디>`에서 두 개발자의 궁합 점수와, 누가 코드를 쓰고 누가 리뷰하면 좋을지 알려 줘요.

## README에 카드 붙이기

사주 페이지 맨 아래 **README에 붙이기**에서 카드 종류와 테마를 고르면 코드를 복사해 줘요. 직접 쓰려면:

```markdown
[![my gitfate](https://gitfate.vercel.app/api/card/daily/ko/<내 아이디>.png)](https://gitfate.vercel.app/ko/<내 아이디>)
```

- **카드**: `natal`(타고난 사주), `daily`(매일 바뀜), `yearly`(올해 운세)
- **언어**: `ko` 또는 `en`
- **테마**: `?theme=` 뒤에 `light`(기본), `dark`, `github-light`, `github-dark`

보는 사람의 GitHub 라이트/다크 모드에 맞춰 자동으로 바꾸려면:

```html
<a href="https://gitfate.vercel.app/ko/<내 아이디>">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://gitfate.vercel.app/api/card/daily/ko/<내 아이디>.png?theme=github-dark">
    <img alt="my gitfate" src="https://gitfate.vercel.app/api/card/daily/ko/<내 아이디>.png?theme=github-light">
  </picture>
</a>
```

## 주소

| 주소 | 내용 |
|---|---|
| `/<언어>/<아이디>` | 사주 페이지 (`언어`는 `ko` 또는 `en`) |
| `/<언어>/<a>/vs/<b>` | 궁합 페이지 |
| `/api/card/{natal,daily,yearly}/<언어>/<아이디>.png` | 1200×630 카드 |
| `/api/card/compat/<언어>/<a>/<b>.png` | 궁합 카드 |

| 옵션 | 쓰는 곳 | 내용 |
|---|---|---|
| `?tz=<IANA 시간대>` | 사주 페이지, 카드 | 원하는 시간대로 사주를 봐요. 예: `?tz=Asia/Seoul` |
| `?tzA=`, `?tzB=` | 궁합 페이지, 궁합 카드 | 위와 같고, 사람마다 하나씩 |
| `?theme=` | 카드 | `light`, `dark`, `github-light`, `github-dark` |

공유한 링크에도 옵션이 그대로 남아서 모두 같은 결과를 봐요. 카드는 링크를 공유할 때 미리보기 이미지로도 쓰여요.

## 태어난 시간대를 정하는 방법

사주는 태어난 곳의 현지 시각으로 보는데, GitHub은 가입 시각을 UTC로만 저장해요. 그래서 아래 순서로 시간대를 정해요.

1. 주소의 `?tz=`가 올바른 IANA 시간대 이름이면 그것을 써요. **출생 국가 변경** 메뉴가 바로 이 값을 바꿔요.
2. 가입 후 90일 안에 올린 공개 커밋 최대 5개에서 가장 많이 나온 UTC 오프셋.
3. 위와 같은 방법으로, 최근 공개 커밋 최대 5개.
4. 프로필의 위치(location)가 시간대로 연결되면 그 시간대. 시간대가 여러 개인 나라는 도시까지 맞아야 해요.
5. UTC.

페이지에는 어떤 방법으로 정했는지 항상 표시돼요.

## 개인정보

- 공개 데이터만 읽어요: 프로필(아이디, 이름, 아바타, 가입 시각, 위치), 공개 저장소의 언어, 기여 수.
- 커밋의 시간대를 알아낼 때는 그 커밋의 `Date:` 헤더 한 줄만 읽고 UTC 오프셋만 남겨요. 작성자 이메일과 코드는 저장하지도, 내보내지도, 로그에 남기지도 않아요.
- 데이터베이스가 없어요. 요청이 올 때 계산하고, 결과는 호스팅 플랫폼이 캐시해요.

### 제외 요청

내 GitHub 아이디가 읽히지 않길 원하면, 그 계정으로 [제외 요청 이슈](https://github.com/Jiseoup/gitfate/issues/new?template=opt_out.yml)를 열거나 [`data/blocklist.json`](data/blocklist.json)에 소문자 아이디를 추가하는 PR을 올려 주세요.

## 로컬 개발

Node.js 20.9 이상이 필요해요.

```bash
npm install
cp .env.example .env.local
npm run dev
```

`.env.local`에 넣을 값:

- `GITHUB_TOKEN`(필수): 공개 데이터를 읽을 GitHub 토큰. **Public repositories (read-only)** 접근만 있고 다른 권한은 없는 fine-grained 토큰이면 충분해요.
- `SITE_URL`(선택): 사이트의 절대 주소. 예: `https://gitfate.vercel.app`. 대표 주소와 미리보기 이미지 주소를 만들 때 써요. Vercel에서는 운영 도메인이, 로컬에서는 `http://localhost:3000`이 기본값이에요.

그 밖의 명령: `npm test`, `npm run lint`, `npm run check:locales`, `npm run build`.

직접 배포하려면 저장소를 [Vercel](https://vercel.com/new)로 가져오고 `GITHUB_TOKEN`만 설정하면 돼요.

## 기여하기

버그 제보, 번역, 새 운세 문구, 수정 모두 환영해요. [CONTRIBUTING.md](CONTRIBUTING.md)를 참고해 주세요(영어). 이슈와 PR은 한국어로 써도 괜찮아요.

## 알려 드려요

재미로 보는 운세예요. 개발 실력과는 아무 관련이 없어요.

## 라이선스

[MIT](LICENSE)
