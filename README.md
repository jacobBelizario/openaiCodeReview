# openaiCodeReview
action to do a code review with open api key and prompt that you want 
- Sample Usage for now basic workflow basically it gets the file changes and asks the AI for a code review 
- can also change to be on push 
- needs OPEN_API_KEY set as secret of your repo GH_TOKEN is optional and would probably be depracated

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
        
      - name: Get Commit Changes
        id: commit_changes
        run: |
          git fetch --unshallow
          CHANGES=$(git show --stat --patch --no-color --no-prefix ${{ github.sha }})
          echo $CHANGES >> changes.txt
          echo "::set-output name=changes::$(cat changes.txt)"
          
      - name: OpenAI PR Review
        id: OpenAIReview
        uses: jacobBelizario/openaiCodeReview@main
        with:
          gh_token: ${{ secrets.GH_ACCESS_TOKEN }}
          ghurl: ${{ github.repository }}
          openai_api_key: ${{ secrets.OPENAI_API_KEY }}
          diff_code: ${{steps.commit_changes.outputs.changes}}
          
      - uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `${{steps.OpenAIReview.outputs.openai_review}}`
            })
