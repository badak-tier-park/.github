# badak-tier-park/.github — Claude 작업 지침

조직 공통 설정 저장소. 조직 프로필(`profile/README.md`)과 **모든 저장소에 적용되는** 이슈·PR 템플릿을 둔다.
**이 문서에는 코드에서 확인할 수 없는 내용만 적는다.**

## 놓치면 문제가 되는 것
- **여기 템플릿을 바꾸면 조직의 모든 저장소에 즉시 적용된다**(자체 템플릿이 없는 저장소). 한 저장소만 위한
  항목은 그 저장소의 `.github/`에 따로 둔다
- 이슈 폼의 `labels`는 **그 저장소에 같은 이름의 라벨이 있을 때만** 붙는다. 폼에 라벨을 추가하면 저장소마다
  라벨이 있는지 확인한다(예: `hotfix`는 badak-web에만 있다)
- 이슈 폼은 **이슈 타입**(조직 설정)과 **종류 라벨**을 함께 붙인다. 짝은 조직 전체에서 고정이다:
  Feature↔`enhancement`, Bug↔`bug`, Hotfix↔`hotfix`, Style↔`style`, Refactor↔`refactor`, Docs↔`documentation`,
  Task↔(종류 라벨 없음). PR은 제목 타입으로 같은 라벨을 쓰고 배포 PR(`dev`→`main`)은 `release`
- PR 템플릿은 `gh pr create --body`로 만들면 자동 적용되지 않는다. 각 저장소 CLAUDE.md는 이 파일을
  `gh api repos/badak-tier-park/.github/contents/.github/PULL_REQUEST_TEMPLATE.md`로 가져와 구조를 맞추게 돼 있다 —
  섹션 이름을 바꾸면 그쪽 문서 서술도 확인한다
- 프로필 README에 열린 PR·이슈 표를 자동으로 갱신하던 워크플로는 2026-10-22에 **일부러 없앴다**
  (봇 커밋이 이력을 덮고, 저장소마다 프로젝트 보드·라벨로 관리하게 되어 중복이었다). 되살리지 않는다.
  이 저장소의 이력은 그때 새 첫 커밋으로 초기화됐다
- 공개 저장소다. 자격증명·project ID·취약점은 적지 않는다

## 조직 저장소 지도
바닥티어는 저장소 여러 개가 **같은 Supabase 프로젝트를 함께 쓴다**(운영 `badak`, 개발 `badak-dev`).
한 저장소에서 테이블·정책을 바꾸면 다른 저장소가 깨질 수 있으니, DB를 건드릴 땐 아래 사용처를 먼저 본다.
공개 저장소이므로 project ID는 문서에 쓰지 않고 Supabase MCP의 `list_projects`로 조회한다.

| 저장소 | 역할 | 배포 | DB와의 관계 |
|--------|------|------|-------------|
| `badak-web` | 웹앱(리그·팀배틀·토너먼트·대시보드·관리) | Vercel (`main`=운영) | 대부분의 테이블을 읽고 쓴다 |
| `badak-bot` | 디스코드 봇(`/유저등록` 등) | EC2 (`main` 푸시 시) | `users` 등록 — 웹은 여기 등록된 사용자만 로그인 가능 |
| `gg-tracker` | 리플레이 감시 데스크톱 앱(Go) | GitHub Release (`main` 푸시 시) | `record-game` 함수로 `games`에 전적 기록 |
| `badak-tier-park-api` | Supabase Edge Functions | `supabase functions deploy` | `record-game`·`get-games`(gg-tracker), `notify-entry`(웹의 엔트리 제출 → 디스코드) |
| `.github` | 조직 프로필·공통 이슈/PR 템플릿 | — | — |

로컬에서는 `~/dev/badak-tier-park/<저장소>`에 나란히 둔다.

## 커밋 전 검증
빌드는 없다. 이슈 폼은 YAML 문법이 틀리면 GitHub이 조용히 무시하고 빈 템플릿처럼 보인다:
```
for f in .github/ISSUE_TEMPLATE/*.yml; do ruby -ryaml -e 'YAML.load_file(ARGV[0])' "$f" || echo "FAIL $f"; done
```
병합 후 아무 저장소의 "New issue" 화면에서 폼이 보이는지 확인한다.

## GitHub 작업 규칙
- `main` 하나뿐이고 보호 규칙이 없다. 그래도 작업 브랜치 → `main` PR로 올린다 — 모든 저장소에 영향이 가므로
  리뷰를 거친다
- Assignees = 작성자, Reviewers = 작성자 외 쓰기 권한자 전원
  (`gh api repos/badak-tier-park/.github/collaborators --jq '.[].login'`), 종류 Labels, 관련 이슈는 `Closes #n`

---

## 전역 개발 규칙 (사용자 전역 CLAUDE.md 복사본)
`~/.claude/CLAUDE.md`는 특정 PC에만 있어 다른 기기에서는 보이지 않으므로 여기에 복사해 둔다.
프로젝트에 국한되지 않는 새 규칙이 생기면 여기와 전역 파일 **양쪽에** 반영한다.
위 프로젝트 규칙과 겹치면 위(프로젝트) 서술이 우선한다.

### 커밋 컨벤션
**Conventional Commits**: `<type>(<scope>): <subject>` — scope는 선택.
- type: `feat` · `fix` · `docs` · `test` · `refactor` · `chore` · `style` · `perf`
- subject는 명령형 한 줄, 끝에 마침표 없음
- 본문은 "무엇"이 아니라 **"왜"**를 설명할 때만 쓴다

### 커밋 전 검증
typecheck·lint·test가 통과하는 상태에서 커밋한다. 명령은 프로젝트마다 다르니
CLAUDE.md·package.json scripts·CI에서 확인한다(이 저장소의 명령은 위 "커밋 전 검증").

### 이슈 정리
이슈를 닫기 전에 하위 이슈(sub-issue) 상태를 확인한다. 하위가 하나라도 열려 있으면
상위는 닫지 않는다. 해결 근거를 코드·커밋에서 확인하지 못한 이슈는 닫지 말고 사용자에게 묻는다.

### PR 작성
- Assignees에 작성자, Reviewers에 작성자를 뺀 팀원 전원, 종류·영역 Labels, 관련 이슈는 본문 `Closes #n`으로
  Development에 연결, 프로젝트를 쓰면 Projects에도 넣는다. 저장소에 자동화가 있어도 `gh pr create`로
  직접 올릴 때는 `--assignee @me --reviewer … --label …`로 채운다(자동화가 안 도는 경우가 있다)
- PR 템플릿이 있으면 그 섹션 구조를 따른다. 하지 않은 테스트는 체크하지 않고, 확인하지 못한 것은 적는다

### 문서 계층
- 루트 CLAUDE.md는 매 세션 로드되므로 전역 규칙과 "놓치면 버그가 되는" 요약만 둔다
- 기능별 상세는 그 디렉토리의 CLAUDE.md에 두고, 루트에 **문서 지도**로 위치를 적는다
- 하위 문서는 그 디렉토리 파일을 열 때만 로드된다 — 다른 디렉토리에서 그 기능을 건드릴 땐
  직접 읽어야 하므로 루트에 요약과 경로를 남긴다
- 코드·git 이력으로 알 수 있는 것은 적지 않는다. 코드로 알 수 없는 "왜"와 도메인 룰만 적는다
