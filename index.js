const { inspect } = require("util");
const core = require("@actions/core");
const github = require("@actions/github");
const fs = require('fs');

const meta = {
  commentFrom: 'Comment Test Coverage as table',
}

async function run() {
  try {
    const inputs = {
      token: core.getInput("token"),
      path: core.getInput("path"),
      title: core.getInput("title"),
    };

    const {
      payload: { pull_request: pullRequest, repository }
    } = github.context;

    if (!pullRequest) {
      core.error("This action only works on pull_request events");
      return;
    }

    const { number: issueNumber } = pullRequest;
    const { full_name: repoFullName } = repository;
    const [owner, repo] = repoFullName.split("/");

    const octokit = new github.getOctokit(inputs.token);

    const data = fs.readFileSync(`${process.env.GITHUB_WORKSPACE}/${inputs.path}`, 'utf8');
    const json = JSON.parse(data);

    const coverage = `<!--json:${JSON.stringify(meta)}-->
|${inputs.title}| %                           | values                                                              |
|---------------|:---------------------------:|:-------------------------------------------------------------------:|
|Statements     |${json.total.statements.pct}%|( ${json.total.statements.covered} / ${json.total.statements.total} )|
|Branches       |${json.total.branches.pct}%  |( ${json.total.branches.covered} / ${json.total.branches.total} )    |
|Functions      |${json.total.functions.pct}% |( ${json.total.functions.covered} / ${json.total.functions.total} )  |
|Lines          |${json.total.lines.pct}%     |( ${json.total.lines.covered} / ${json.total.lines.total} )          |
`;

    const list = await octokit.issues.listComments({
      owner,
      repo,
      issue_number: issueNumber,
    });

    await octokit.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body: `
<details>
<summary> whole response</summary>

\`\`\`json\n${
JSON.stringify(
  list.data
    // .filter(c => c.user.type === 'Bot' && /^<!--json:{.*?}-->/.test(c.body))
    // .map((c) => JSON.parse(c.body.replace(/^<!--json:|-->.*$/, '')))
  ,
  null,
  2)
}\n\`\`\`

</details>

<details>
<summary> filtered</summary>

\`\`\`json\n${
JSON.stringify(
  list.data
    .filter(c => c.user.type === 'Bot' && /^<!--json:{.*?}-->/.test(c.body))
    // .map((c) => JSON.parse(c.body.replace(/^<!--json:|-->.*$/, '')))
  ,
  null,
  2)
}\n\`\`\`

</details>

<details>
<summary> transformed</summary>

\`\`\`json\n${
JSON.stringify(
  list.data
    .filter(c => c.user.type === 'Bot' && /^<!--json:{.*?}-->/.test(c.body))
    .map((c) => ({
      meta: JSON.parse(c.body.replace(/^<!--json:|-->(.|\n|\r)*$/g, '')),
      comment: c,
    }))
  .filter(c => c.meta.commentFrom === meta.commentFrom)
  .map(c => c.id)
  ,
  null,
  2)
}\n\`\`\`

</details>
`,
    });

    await octokit.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body: coverage,
    });
  } catch (error) {
    core.debug(inspect(error));
    core.setFailed(error.message);
  }
}

run();
