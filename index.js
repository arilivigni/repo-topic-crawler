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

const query = `query($org: String!, $page: String) {
        organization(login: $org) {
            membersWithRole(first: 100, after: $page) {
                pageInfo {
                    endCursor
                    hasNextPage
                }
                nodes {
                    login
                    name
                    organizationVerifiedDomainEmails(login: $org)
                }
            }
        }
    }`

async function getUsers(client, org) {
    let hasNextPage = true
    let page = null
    const users = []

    console.log(`Retrieving users for ${org}`)
    while (hasNextPage) {
        const response = await client.graphql(query, {
            org: org,
            page: page
        })
        users.push(...response.organization.membersWithRole.nodes)
        page = response.organization.membersWithRole.pageInfo.endCursor
        hasNextPage = response.organization.membersWithRole.pageInfo.hasNextPage
    }

    const results = {}
    for (const user of users) {
        if (user.organizationVerifiedDomainEmails.length === 0) {
            if (user.name) {
                results[user.login] = user.name
            } else {
                results[user.login] = user.login
            }
        } else {
            results[user.login] = user.organizationVerifiedDomainEmails[0]
        }
    }

    return results
}

async function sendComment(client, org, repo, issueNumber, body) {
    console.log(`Sending comment to ${org}/${repo}#${issueNumber}`)
    await client.issues.createComment({
        owner: org,
        repo: repo,
        issue_number: issueNumber,
        body: body
    })
}

async function main() {
    const actor = core.getInput('actor', {required: true, trimWhitespace: true})
    const adminToken = core.getInput('admin_token', {required: true, trimWhitespace: true})
    const _body = core.getInput('body', {required: true, trimWhitespace: true}).trim().split(' ')
    const issueNumber = core.getInput('issue_number', {required: true, trimWhitespace: true})
    const org = core.getInput('org', {required: true, trimWhitespace: true})
    const repo = core.getInput('repo', {required: true, trimWhitespace: true})
    const githubToken = core.getInput('token', {required: true, trimWhitespace: true})
    const queryRepo = _body[_body.length - 1]

    const client = await newClient(adminToken)
    const commentClient = await newClient(githubToken)

    let users
    try {
        users = await getUsers(client, org)
    } catch (e) {
        await sendComment(commentClient, org, repo,issueNumber, `@${actor} There was an error retrieving the users for ${org}: ${e.message}`)
        core.setFailed(e.message)
    }

    let members
    try {
        console.log(`Retrieving direct admins for ${org}/${queryRepo}`)
        members = await client.paginate(client.repos.listCollaborators, {
            owner: org,
            repo: queryRepo,
            affiliation: 'direct',
            per_page: 100
        })
    } catch (e) {
        await sendComment(commentClient, org, repo, issueNumber,`@${actor} There was an error retrieving the direct admins for ${repo}: ${e.message}`)
        core.setFailed(e.message)
    }

    const admins = members.filter(member => member.permissions.admin).map(member => member.login)

    let teams
    try {
        console.log(`Retrieving teams for ${org}/${repo}`)
        teams = await client.paginate(client.repos.listTeams, {
            owner: org,
            repo: queryRepo,
        })
    } catch (e) {
        await sendComment(commentClient, org, repo, issueNumber,`@${actor} There was an error retrieving the teams for ${repo}: ${e.message}`)
        core.setFailed(e.message)
    }

    const adminTeams = teams.filter(t => t.permission === 'admin')
    for (const team of adminTeams) {
        try {
            console.log(`Retrieving members for ${team.name}`)
            const members = await client.paginate(client.teams.listMembersInOrg, {
                org: org,
                team_slug: team.slug,
                per_page: 100
            })
            for (const member of members) {
                if (!admins.includes(member.login)) {
                    admins.push(member.login)
                }
            }
        } catch (e) {
            await sendComment(commentClient, org, repo, issueNumber,`@${actor} There was an error retrieving the members for ${team.name}: ${e.message}`)
            core.setFailed(e.message)
        }
    }

    if(admins.length === 0) {
        await sendComment(commentClient, org, repo, issueNumber,`@${actor} There are no admins for ${repo}`)
        core.setFailed(`There are no admins for ${queryRepo}`)
    } else {
        let body = `Because the repository you are seeking access to is maintained by project members, the GitHub admin team is not able to assist with this request, as we do not fulfill administrative requests for repositories with active administrators. Please contact the following members for assistance with access to https://github.com/${org}/${queryRepo}:\n\n`
        for (const admin of admins) {
            body += `* ${users[admin]}\n`
        }
        await sendComment(commentClient, org, repo, issueNumber, body)
    }
}

main()
