# openaiCodeReview

- Given changed files in a commit write a code review using open Anthropic claude
- HOW TO USE: make a new yml in root dir of your repository under .github/workflow
- Make sure the GH_ACCESS_TOKEN(github access token: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens) and ANTHROPIC_API_KEY is under your repository secrets
```
name: OpenAI Code Review
on:
  pull_request:
    types:
      - opened
      - reopened
      - synchronize
jobs:
  compare_commits:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v2
        
      - name: Get Diff Files
        id: diff_files
        run: |
          git fetch
          FILES=$(git diff ${{ github.event.pull_request.base.sha }}..${{ github.event.pull_request.head.sha }})
          echo $FILES >> diff_files.txt
          echo "::set-output name=diffs::$(cat diff_files.txt)"
          
        
      - name: Get Committed Files
        id: committed_files
        run: |
          git fetch --unshallow
          FILES=$(git diff --name-only ${{ github.event.pull_request.base.sha }}..${{ github.event.pull_request.head.sha }})
          echo $FILES >> committed_files.txt
          echo "::set-output name=files::$(cat committed_files.txt)"
          
      - name: OpenAI PR Review
        id: OpenAIReview
        uses: jacobBelizario/openaiCodeReview@main
        with:
          gh_token: ${{ secrets.GH_ACCESS_TOKEN }}
          ghurl: ${{ github.repository }}
          anthropic_key: ${{ secrets.ANTHROPIC_API_KEY }}
          diff_code: ${{steps.committed_files.outputs.files}}
          diff_file: ${{steps.diff_files.outputs.diffs}}
          
      - uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `${{steps.OpenAIReview.outputs.openai_review}}`
            })
```
