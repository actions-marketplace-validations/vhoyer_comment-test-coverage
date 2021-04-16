# Comment Test Coverage

A GitHub action to comment on a PR on GitHub with a simple test coverage summary.

## Workflow example

```yml
name: run-coverage

on:
  release:
    types:
      - published
  pull_request:
    types:
      - synchronize
      - labeled
      - ready_for_review

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    if: github.event.pull_request.draft == false
    env:
      CI: true
      NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
    steps:
    - name: Check if run
      run: |
        [ ${{
          contains(github.event.pull_request.labels.*.name, 'run-coverage')
          || startsWith(github.ref, 'refs/tags/')
        }} == true ] || return 1 # just add the `run-coverage` label on your PR and you are good to go
        # remember, this is bash and inside the brakets ([]), those things are strings not booleans.
        #
        # if the pull_request has a tag named "run-coverage"
        # or the trigger has a tag, which (on practice) happens only on prod deploy

    - uses: actions/checkout@v2

    - name: Use Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '14'

    - name: Install dependencies
      run: npm install

    - name: Run lint
      run: npm run lint

    - name: Run test
      run: npm run test:coverage -- --bail

    - name: Comment Test Coverage
      uses: vhoyer/comment-test-coverage@1.3.0
      with:
        token: ${{ secrets.GITHUB_TOKEN }}
        path: coverage/coverage-summary.json
        title: Test Coverage
```

## Usage with Jest

1. In your jest.config.js set `coverageReporters` to include `json-summary`;
2. Check the `coverageDirectory`, the default value for it is `<rootDir>/coverage`, make sure this matches with the `path` option on the workflow;
3. Profit.

## Parameters

- `token` (**required**) - The GitHub authentication token (workflows automatically set this for you, nothing needed here)
- `path` (**required**) - Path to your coverage-summary.json file
- `title` (**optional**) - Title of comment in PR (defaults to "Test Coverage")

## How to edit action

1. Clone down repo, `npm install`, and make changes
2. Run `npm run package`
3. Commit changes
4. Create a new release on GitHub to publish latest version of the action. See https://help.github.com/en/actions/building-actions/publishing-actions-in-github-marketplace

## License

Repurposed from https://github.com/peter-evans/commit-comment, Copyright (c) 2019 Peter Evans and https://github.com/mshick/add-pr-comment, Copyright (c) 2019 Michael Shick
