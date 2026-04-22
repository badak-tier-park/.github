import fs from "fs";

const TOKEN       = process.env.GH_TOKEN;
const ORG         = process.env.ORG_NAME;
const README_PATH = "profile/README.md";
const MAX_PRS     = 30;
const MAX_ISSUES  = 30;

const HEADERS = {
  Authorization:        `Bearer ${TOKEN}`,
  Accept:               "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
};

// ──────────────────────────────────────────────
// GitHub Search API로 org 내 오픈 PR 전체 조회
// ──────────────────────────────────────────────
async function fetchOpenPRs() {
  const prs = [];
  let page = 1;

  while (prs.length < MAX_PRS) {
    const url = new URL("https://api.github.com/search/issues");
    url.searchParams.set("q",        `org:${ORG} is:pr is:open`);
    url.searchParams.set("sort",     "created");
    url.searchParams.set("order",    "desc");
    url.searchParams.set("per_page", "30");
    url.searchParams.set("page",     String(page));

    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) throw new Error(`GitHub API error: ${res.status} ${await res.text()}`);

    const data  = await res.json();
    const items = data.items ?? [];
    if (items.length === 0) break;

    prs.push(...items);
    if (items.length < 30 || prs.length >= (data.total_count ?? 0)) break;
    page++;
  }

  return prs.slice(0, MAX_PRS);
}

// ──────────────────────────────────────────────
// GitHub Search API로 org 내 오픈 이슈 전체 조회
// ──────────────────────────────────────────────
async function fetchOpenIssues() {
  const issues = [];
  let page = 1;

  while (issues.length < MAX_ISSUES) {
    const url = new URL("https://api.github.com/search/issues");
    url.searchParams.set("q",        `org:${ORG} is:issue is:open`);
    url.searchParams.set("sort",     "created");
    url.searchParams.set("order",    "desc");
    url.searchParams.set("per_page", "30");
    url.searchParams.set("page",     String(page));

    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) throw new Error(`GitHub API error: ${res.status} ${await res.text()}`);

    const data  = await res.json();
    const items = data.items ?? [];
    if (items.length === 0) break;

    issues.push(...items);
    if (items.length < 30 || issues.length >= (data.total_count ?? 0)) break;
    page++;
  }

  return issues.slice(0, MAX_ISSUES);
}

// ──────────────────────────────────────────────
// PR 목록 → Markdown 테이블
// ──────────────────────────────────────────────
function buildPRTable(prs) {
  if (prs.length === 0) return "_현재 오픈된 PR이 없습니다_ ✅";

  const now = new Date().toISOString().replace("T", " ").slice(0, 16) + " UTC";

  const lines = [
    `> 마지막 업데이트: \`${now}\`  &nbsp;|&nbsp;  총 **${prs.length}개** 오픈`,
    "",
    "| 리포지토리 | PR 제목 | 작성자 | 라벨 | 생성일 |",
    "|:---|:---|:---|:---|:---|",
  ];

  for (const pr of prs) {
    const parts    = (pr.repository_url ?? "").split("/");
    const repoName = parts.at(-1) ?? "unknown";
    const repoUrl  = `https://github.com/${ORG}/${repoName}`;

    const title   = pr.title.replaceAll("|", "\\|");
    const author  = pr.user.login;
    const created = pr.created_at.slice(0, 10);

    const labels = (pr.labels ?? []);
    const labelBadges = labels.length
      ? labels.map(l => `\`${l.name}\``).join(" ")
      : "–";

    lines.push(
      `| [${repoName}](${repoUrl}) ` +
      `| [${title}](${pr.html_url}) ` +
      `| [@${author}](https://github.com/${author}) ` +
      `| ${labelBadges} ` +
      `| ${created} |`
    );
  }

  return lines.join("\n");
}

// ──────────────────────────────────────────────
// 이슈 목록 → Markdown 테이블
// ──────────────────────────────────────────────
function buildIssueTable(issues) {
  if (issues.length === 0) return "_현재 오픈된 이슈가 없습니다_ ✅";

  const now = new Date().toISOString().replace("T", " ").slice(0, 16) + " UTC";

  const lines = [
    `> 마지막 업데이트: \`${now}\`  &nbsp;|&nbsp;  총 **${issues.length}개** 오픈`,
    "",
    "| 리포지토리 | 이슈 제목 | 작성자 | 라벨 | 생성일 |",
    "|:---|:---|:---|:---|:---|",
  ];

  for (const issue of issues) {
    const parts    = (issue.repository_url ?? "").split("/");
    const repoName = parts.at(-1) ?? "unknown";
    const repoUrl  = `https://github.com/${ORG}/${repoName}`;

    const title   = issue.title.replaceAll("|", "\\|");
    const author  = issue.user.login;
    const created = issue.created_at.slice(0, 10);

    const labels = (issue.labels ?? []);
    const labelBadges = labels.length
      ? labels.map(l => `\`${l.name}\``).join(" ")
      : "–";

    lines.push(
      `| [${repoName}](${repoUrl}) ` +
      `| [${title}](${issue.html_url}) ` +
      `| [@${author}](https://github.com/${author}) ` +
      `| ${labelBadges} ` +
      `| ${created} |`
    );
  }

  return lines.join("\n");
}

// ──────────────────────────────────────────────
// README 내 마커 구간 교체
// ──────────────────────────────────────────────
function updateReadme(prTable, issueTable) {
  let content = fs.readFileSync(README_PATH, "utf-8");

  const prPattern    = /<!-- PR_START -->[\s\S]*?<!-- PR_END -->/;
  const issuePattern = /<!-- ISSUE_START -->[\s\S]*?<!-- ISSUE_END -->/;

  if (!prPattern.test(content)) {
    throw new Error(
      "README.md 에 <!-- PR_START --> / <!-- PR_END --> 마커가 없습니다.\n" +
      "아래 내용을 README 원하는 위치에 추가해주세요:\n\n" +
      "<!-- PR_START -->\n<!-- PR_END -->"
    );
  }
  if (!issuePattern.test(content)) {
    throw new Error(
      "README.md 에 <!-- ISSUE_START --> / <!-- ISSUE_END --> 마커가 없습니다.\n" +
      "아래 내용을 README 원하는 위치에 추가해주세요:\n\n" +
      "<!-- ISSUE_START -->\n<!-- ISSUE_END -->"
    );
  }

  content = content.replace(prPattern,    `<!-- PR_START -->\n${prTable}\n<!-- PR_END -->`);
  content = content.replace(issuePattern, `<!-- ISSUE_START -->\n${issueTable}\n<!-- ISSUE_END -->`);
  fs.writeFileSync(README_PATH, content, "utf-8");
}

// ──────────────────────────────────────────────
// 메인
// ──────────────────────────────────────────────
console.log(`🔍 [${ORG}] 오픈 PR 조회 중...`);
const prs = await fetchOpenPRs();
console.log(`   → ${prs.length}개 발견`);

console.log(`🔍 [${ORG}] 오픈 이슈 조회 중...`);
const issues = await fetchOpenIssues();
console.log(`   → ${issues.length}개 발견`);

const prTable    = buildPRTable(prs);
const issueTable = buildIssueTable(issues);
updateReadme(prTable, issueTable);

console.log("✅ README.md 업데이트 완료");
