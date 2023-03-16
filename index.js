const core = require('@actions/core')
const artifact = require('@actions/artifact')
const fs = require('fs');
const yaml = require('js-yaml');
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
    const adminToken = core.getInput('admin_token', {required: true, trimWhitespace: true})
    const org = core.getInput('org', {required: true, trimWhitespace: true})
    const repoTopic = core.getInput('repo_topic', {required: true, trimWhitespace: true})
    const repoFile = core.getInput('repo_file', {required: true, trimWhitespace: true})
    let failed = false
    const collectedRepos = []
    const client = await newClient(adminToken)
    const _repos = await client.paginate('GET /orgs/{org}/repos', {
        org: org,
        per_page: 100
    })
    // filter on repository topic from input
    const repos = _repos.filter(repo => repo.topics.includes(repoTopic))
    for (const repo of repos) {
        // check if repo has repository file from input
        try {
            const {data:response} = await client.request('GET /repos/{owner}/{repo}/contents/{path}', {
                owner: repo.owner.login,
                repo: repo.name,
                path: repoFile
            })
            core.info(`Found ${repoFile} in repository ${repo.name}`)
            collectedRepos.push(repo.name, yaml.load(fs.readFileSync(repoFile), 'utf8'));
            // collectedRepos[repo.name] = JSON.parse(Buffer.from(response.content, 'base64').toString())
        } catch (e) {
            failed = true
            core.error(`Error: ${e}`)
        }
    }
    fs.writeFileSync('data.json', JSON.stringify({[repoTopic]: collectedRepos}, null, 2))
    await artifact.uploadArtifact('collected-repos', ['data.json'], __dirname, {
        continueOnError: false,
        retentionDays: 90
    })
    if (failed) {
        core.setFailed(`Failed to get repos with topic ${repoTopic}`)
    }
}

main()
