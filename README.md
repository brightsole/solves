# Solves

### TODO
- think of a clever way to get the minimalist `associationsKey` from all `associationsKey`s on the underlying hop records
  - decide if hops should do it, even if it means hops will have to fetch alot of hops
    - this is _probably_ the right call
- create postman collection for it
- create `startNewAttempt` that takes old id and runs batch delete on old `hops`
  - and returns a new attempt
- swallow errors on solves that have the exact same content as previous solves
  - obviously don't save the same shit twice
  - think of a way to instantly validate that "oops they did it again"
