# Solves

[![Dependabot Updates](https://github.com/brightsole/solves/actions/workflows/dependabot/dependabot-updates/badge.svg)](https://github.com/brightsole/solves/actions/workflows/dependabot/dependabot-updates) [![Auto merge basic check](https://github.com/brightsole/solves/actions/workflows/test.yml/badge.svg)](https://github.com/brightsole/solves/actions/workflows/test.yml) [![Deploy preview environment](https://github.com/brightsole/solves/actions/workflows/deploy-preview.yml/badge.svg)](https://github.com/brightsole/solves/actions/workflows/deploy-preview.yml)

[development](https://vrvnzi5szg.execute-api.ap-southeast-2.amazonaws.com/graphql)

<pre>
                      ┌────────────────────────────────────────────────────────────────┐
                      │    <a href="https://github.com/brightsole/jumpingbeen.com">jumpingbeen.com</a>                                             │
                      └─────────────┬─▲────────────────────────────────────────────────┘
                                    │ │
                      ┌───────────────────────────────────────────────────────────┐
                      │    <a href="https://github.com/brightsole/gateway">Federation gateway</a>                                     |
                      │───────────────────────────────────────────────────────────┼───┐
    ┌────────────────►│   DMZ                                                     ◄──┐│
  ┌──────────────────►└───────────────────────────────────────────────────────────┘  ││
  │ │                   ▲                                                      ▲     ││
  │ │                   │  you're here                                         │     ││
  │ │                 ┌─┴───*────────────────────────────────────────────────┐ │  ┌──┴▼──────────────────┐
  │ │                 │    <a href="https://github.com/brightsole/solves">Solves service</a>                                    │ │  │ Users service (soon) │
  │ │                 └┬───────────▲───┬─▲────────┬▲────────┬▲───────────────┘ │  └──────────────────────┘
  │ │                  │           │   │ │        ││        ││                 │
  │ │                  │Attempts   │ ┌─▼─┴────┐   ││        ││                 │
  │ │                  │ are       │ ┌────────┐   ││        ││                 │
  │ │                  │memory only│ │  DDB   │   ││        ││                 │
  │ │                  └───────────┘ │ Solves │   ││        ││                 │
  │ │                                └────────┘   ││        ││                 │
  │┌┴─────────────────────────────────────────────▼┴──┐   ┌─▼┴─────────────────┴─────────────────────────┐
  ││    <a href="https://github.com/brightsole/hops">Hops service</a>                                  ├───►<a href="https://github.com/brightsole/games">    Games service</a>                             │
  │└──────▲┬─────────┬─▲─────────┬────────────┬─▲─────◄───┴──┬─▲─────────────────────────────────────────┘
  │       ││         │ │         │            │ │            │ │
  │       ││       ┌─▼─┴───┐     │User      ┌─▼─┴───┐      ┌─▼─┴───┐
  │       ││       ┌───────┐     │Goo       ┌───────┐      ┌───────┐
  │       ││       │  DDB  │     │          │  DDB  │      │  DDB  │
  │       ││       │ Links ├───┐ └─────────►│ Hops  │      │ Games │
  │       ││       └───────┘   └───────────►└───────┘      └───────┘
 ┌┴───────┴▼──────────────────────────────────────────┐
 │    <a href="https://github.com/brightsole/words">Words service</a>                                   │
 └──────┬───────────────────────▲─────┬─▲─────────────┘
        │                       │     │ │
        ├─────►Dictionary api───┤   ┌─▼─┴───┐
        │                       │   ┌───────┐
        ├─────►RiTa package─────┤   │  DDB  │
        │                       │   │ Words │
        └─────►Datamuse api─────┘   └───────┘
</pre>

### TODO
- create postman collection for it
- deploy to prod
- would be really nice to tell the queries/mutations if this was a cold start
