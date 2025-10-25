# items (SOLOSIS-SST)

[![Auto merge basic check](https://github.com/brightsole/solosis-sst/actions/workflows/test.yml/badge.svg)](https://github.com/brightsole/solosis-sst/actions/workflows/test.yml) [![Deploy preview environment](https://github.com/brightsole/solosis-sst/actions/workflows/deploy-preview.yml/badge.svg)](https://github.com/brightsole/solosis-sst/actions/workflows/deploy-preview.yml)

[<img src="solosis.svg?sanitize=true" height=250>]()

## INFO

This is a generic item CRUD/GraphQL&REST service. It creates, updates, deletes, and allows for direct gets as well as supporting an _ok start_ for a query language. It retrieves items in 35-40ms (std of 5-10ms). It's fast enough, trust me.
<details>
<summary><strong>Before running the service</strong></summary>

- log into the aws account
- create a new user, assign permissions directly to it, the only permission being: administrator access
- copy the KEY ID and the SECRET ACCESS KEY
- add them to the `~/.aws/credentials` like this:

	```
	[your-application]
	aws_access_key_id = KEY_ID
	aws_secret_access_key = SECRET_KEY
	```

- add configuration to your `~/.aws/config` as well:

	```
	[profile your-application]
	output=json
	region=ap-southeast-2
	```

</details>

### RUNNING THE SERVICE
run the service locally with `npm start`
deploy the service to sst by configuring the github action. you'll need to set up OIDC and aws creds. I'm a repo not a library; look it up.

It is, however, a **high trust** service. You should be running it behind a graphql gateway that handles pulling auth details out and mapping them onto `x-user-id` headers. It's a federated service after all.

## TODOS
1. expand the query language to allow for better lookin' up stuff (we only allow looking up all items belonging to a user)
1. controller error wrapper to human-print dynamoose goo
1. extract routes file from rest server same as resolvers


### LRU-Cache

<aside>
<strong>tl;dr</strong> LRU cache improves performance with no downside.
</aside>

<details>
<summary><strong>Performance breakdown</strong></summary>

Graphql shows a pretty massive improvement in performance, relative to REST. Overall, the response speed is quite comparable and peformant before adding an LRU cache. It slows execution of REST by about a ms, but boosts GQL by 2+, and makes it far more stable. There's practically no downside, as in a serverless environment you're going to get everything blown away all the time anyway, and have a large memory bandwidth to work with.

Strangely, the p99 performance inverts and gql is better by a large margin, and it's a pattern I've seen in other deployed environments. Unsure the exact cause, but it is interesting.

#### before-cache performance item lookup

endpoint | n | ok | fail | min_ms | p50_ms | p90_ms | p95_ms | p99_ms | max_ms | mean_ms | std_ms
---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:
REST | 100 | 100 | 0 | 25.81 | 32.07 | 37.95 | 42.33 | 60.13 | 94.65 | 33.58 | 7.71
GraphQL | 100 | 100 | 0 | 34.76 | 42.66 | 51.62 | 57.58 | 118.03 | 125.76 | 45.82 | 12.59

comparison | mean_diff_ms | mean_diff_pct | p50_diff_ms | p90_diff_ms | p95_diff_ms | p99_diff_ms
---|---:|---:|---:|---:|---:|---:
GraphQL-REST | 12.23 | 36.43 | 10.59 | 13.68 | 15.25 | 57.90

#### after-cache performance item lookup

endpoint | n | ok | fail | min_ms | p50_ms | p90_ms | p95_ms | p99_ms | max_ms | mean_ms | std_ms
---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:
REST | 100 | 100 | 0 | 25.54 | 32.94 | 38.87 | 46.17 | 80.43 | 98.76 | 35.04 | 9.88
GraphQL | 100 | 100 | 0 | 35.91 | 40.70 | 47.72 | 49.64 | 56.08 | 71.84 | 41.74 | 4.96

comparison | mean_diff_ms | mean_diff_pct | p50_diff_ms | p90_diff_ms | p95_diff_ms | p99_diff_ms
---|---:|---:|---:|---:|---:|---:
GraphQL-REST | 6.70 | 19.13 | 7.76 | 8.85 | 3.48 | -24.36

</details>

<a href="https://www.buymeacoffee.com/Ao9uzMG" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-violet.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>
