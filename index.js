const core = require('@actions/core')
const {Octokit} = require("@octokit/rest")
const {retry} = require("@octokit/plugin-retry")
const {throttling} = require("@octokit/plugin-throttling")

const _Octokit = Octokit.plugin(retry, throttling)

async function newClient (token) {
    return new _Octokit({
        auth: token,
        retries: 10,
        throttle: {
            onRateLimit: (retryAfter, options, octokit) => {
                octokit.log.warn(`Request quota exhausted for request ${options.method} ${options.url}`);
                if (options.request.retryCount === 0) {
                    octokit.log.info(`Retrying after ${retryAfter} seconds!`);
                    return true;
                }
            },
            onSecondaryRateLimit: (retryAfter, options, octokit) => {
                octokit.log.warn(`Abuse detected for request ${options.method} ${options.url}`);
                if (options.request.retryCount === 0) {
                    octokit.log.info(`Retrying after ${retryAfter} seconds!`);
                    return true;
                }
            },
        }
    });
}

async function main() {
    // const actor = core.getInput('actor', {required: true, trimWhitespace: true})
    const adminToken = core.getInput('admin_token', {required: true, trimWhitespace: true})
    // const _body = core.getInput('body', {required: true, trimWhitespace: true}).trim().split(' ')
    // const issueNumber = core.getInput('issue_number', {required: true, trimWhitespace: true})
    // const org = core.getInput('org', {required: true, trimWhitespace: true})
    // const repo = core.getInput('repo', {required: true, trimWhitespace: true})
    // const githubToken = core.getInput('token', {required: true, trimWhitespace: true})
    // const queryRepo = _body[_body.length - 1]

    const client = await newClient(adminToken)
    // const commentClient = await newClient(githubToken)

    const repos = await client.paginate('GET /orgs/{org}/repos', {
        org: 'department-of-veterans-affairs',
        per_page: 100
    })
    for (const repo of repos) {
        // check if repo has .github/models.yml exists
        try {
            await client.request('GET /repos/{owner}/{repo}/contents/{path}', {
                owner: repo.owner.login,
                repo: repo.name,
                path: '.github/models.yml'
            })
            console.log(`Found ${repo.name}`)
            await fs.appendFileSync('./models.yml', `${repo.name}\n`)
        } catch (e) {
            console.error(`Error: ${e}`)
        }
    }
}

main()
