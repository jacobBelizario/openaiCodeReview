# openaiCodeReview

Given changed files in a commit write a code review using open ai gpt3.5
example usage whenever there is a pull request regardless of the branch
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
          openai_api_key: ${{ secrets.OPENAI_API_KEY }}
          diff_code: ${{steps.committed_files.outputs.files}}
          
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
