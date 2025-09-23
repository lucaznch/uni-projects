# TupleSpaces

Check the [original repository](https://github.com/lucaznch/SDis)!

## 1 Introduction

The goal of the Distributed Systems project is to develop the TupleSpaces system, a service that implements a **distributed tuple space**. The system will be implemented using [gRPC](https://grpc.io/) and Java (with one exception, described later).

The service allows one or more users (also called *workers*) to place tuples in the shared space, read existing tuples, and remove tuples from the space. A tuple is an ordered set of fields *<field_1, field_2, ..., field_n>*.

In this project, a tuple must be instantiated as a string (*string*). For example, the *string* containing `"<vacancy,sd,shift1>"`.

In a tuple space, multiple identical instances can coexist. For example, there might be multiple tuples `"<vacancy,sd,shift1>"`, indicating the existence of multiple vacancies.

You can search the tuple space for a given tuple to read or remove. In the simplest variant, you can search for a specific tuple. For example, `"<vacancy,sd,shift1>"`.

Alternatively, you can use Java regular expressions to allow matching with multiple values. For example, `"<vacancy,sd,[^,]+>"` matches both `"<vacancy,sd,shift1>"` and `"<vacancy,sd,shift2>"`.

More information about distributed tuple spaces, as well as a description of a system that realizes this abstraction, can be found in the course bibliography and in the following article:
- A. Xu and B. Liskov. [A Design for a Fault-Tolerant, Distributed Implementation of Linda](http://www.ai.mit.edu/projects/aries/papers/programming/linda.pdf). In 1989, The Nineteenth International Symposium on Fault-Tolerant Computing. Digest of Papers (FTCS), pages 199–206.

The operations available to the user are [^1] *put*, *read*, *take*, and *getTupleSpacesState*.

[^1]: We use the English nomenclature from the course bibliography, but replace *write* with *put*, which seems clearer to us. Note that the original article uses a different nomenclature.

* The *put* operation adds a tuple to the shared space.

* The *read* operation accepts the tuple description (possibly with a regular expression) and returns a tuple that matches the description, if any. This operation blocks the client until a tuple that matches the description is available. The tuple is not removed from the tuple space.

* The *take* operation accepts the tuple description (possibly with a regular expression) and returns a tuple that matches the description. This operation blocks the client until a tuple that matches the description is available. The tuple is removed from the tuple space.

* The *getTupleSpacesState* operation takes no arguments and returns a list of all tuples on each server.

Users access the **TupleSpaces** service through a client process, which interacts with one or more servers offering the service through remote procedure calls.


## 2 Project Objectives and Steps

In this project, students will:

- Develop a distributed system using a current **RPC framework** (**gRPC**), practicing its main communication models (blocking stubs and asynchronous stubs).

- **Replicate** a distributed service using a realistic architecture.

- Understand how **concurrency** is prevalent in a distributed system: not only concurrency between distributed processes, but also concurrency between threads running on servers. Using this concurrency as a starting point, implement algorithms that ensure the desired coherence.

- Investigate **academic research articles**, which describe some of the algorithms implemented in the project. Understand how advances in these scientific fields are described in these articles.

The project has three objectives. Two are mandatory and one is optional.

To achieve each objective, we define multiple steps. Below, we describe each objective and its constituent steps.


### Objective A

Develop a solution in which the service is provided by a single server (i.e., a simple client-server architecture, without server replication), which accepts requests at a well-known address/port.

Clients interact with a replication **frontend**, which in turn acts as a mediator with the server.

Both clients and the *frontend* must use gRPC *blocking stubs*.

#### Step A. 1

System implemented without a frontend, in which clients interact directly with the server.

Two clients are available, one implemented in Java and the other in Python.

#### Step A. 2

With a frontend in the path between clients and the server.

Note:
- The system must support multiple frontends running, each serving a subset of clients. However, in this project, we will only test the case of one frontend.


### Objective B

Develop an alternative solution where **the service is replicated across three servers**. In this solution, the front-end will need to use non-blocking gRPC stubs.

The remote interface (`.proto` file) for the replicated servers is not provided in the codebase.

Each group must create this remote interface. We recommend adapting the `TupleSpaces.proto` file provided by the instructors. Interfaces that differ unnecessarily from `TupleSpaces.proto` will be penalized.

#### Step B. 1

Develop the *read* and *put* operations (not supporting the *take* operation for now), following the Xu and Liskov algorithm (mentioned above).

In short, when a client wishes to invoke one of these operations,
the front-end begins by sending the request to all servers and then waits for responses (from one server, in the case of _read_, or from all servers, in the case of _put_).

To allow debugging of the replicated system's operation, the client, when invoking a replicated operation (*read*, *put*, and subsequently *take*), should also be allowed to optionally **specify a delay** (in seconds) that each replica receiving the request should wait before executing it.

The delay associated with each request should be sent as *gRPC metadata* in the request to the front-end and in the requests that the front-end sends to the replicas.

#### Step B. 2

Also develop the code necessary to execute the _take_ operation.

Instead of the solution proposed in the Xu/Liskov algorithm, a solution based on **Maekawa's mutual exclusion algorithm**, described in the course bibliography, should be developed.

Conceptually, the front-end should implement a take request by performing the following three steps:

1. Enter the critical section (according to Maekawa's algorithm);
2. Once in mutual exclusion, invoke the *take* operation on all replicas and wait for a response from all of them;
3. Exit the critical section (according to Maekawa's algorithm).

The following constraints must be taken into account:

- Regarding the centralized tuple space constructed in the previous step, the replicated solution must assume the following restriction: the *take* operation can only receive the designation of a specific tuple (i.e., regular expressions are not accepted as arguments for the replicated *take* operation).

- It must be assumed that each client has a numeric **client_id**, which is passed as an argument when the client is launched.

Given this *client_id*, the *voter set, V_i,* used by Maekawa's algorithm should be the following: *{client_id mod 3, (client_id + 1) mod 3}* (where each element in the set identifies a replica, from 0 to 2).

- Preventing **deadlock** situations is not part of this project.

- The algorithm described in Maekawa's original paper includes important differences that should not be considered in this project. In other words, the reference is the algorithm described in the course bibliography.

We will prioritize implementations that, while respecting the design described above, allow the replicated system to serve *take* requests to different tuples in parallel.


### Objective C

Refine the solution obtained in the previous objective.

#### Step C.1

Extend the solution to allow the *take* operation to also receive a regular expression as an argument.

As in the previously constructed solution, the first step of the algorithm continues to send the request to only one *voter set*.

#### Step C.2

Optimize the solution constructed in step B.2, trying to reduce the number of messages exchanged and/or the waiting time in the *front-end* critical path.

Suggestion: See the discussion in section 4.2 of the Xu and Liskov paper.

To submit the solution for steps C.1 and/or C.2, in addition to the solution code, each group is also required to submit a document of no more than 2 pages describing the solution design.

## 3 Project Execution Phasing

Students may choose to develop only objectives A and B of the project (*difficulty level **"Bring 'em on!"***) or also objective C (*difficulty level **"I am Death incarnate!"***).

The chosen difficulty level affects how each group's project is evaluated and the maximum score that can be achieved (see Section 6 of this announcement).

The project includes three deliverables. The deadline for each deliverable (i.e., the due date) is published on the SD labs website.

Depending on the difficulty level chosen, the phasing of the steps over time will differ.

### Phasing of the "Bring 'em on!" Difficulty Level

#### Delivery 1

- Step A. 1

#### Delivery 2

- Steps A. 2 and B. 1

#### Delivery 3

- Steps B. 2 and C. 1

### Difficulty Level "I am Death incarnate!" Phase-in

#### Delivery 1

- Steps A. 1 and A. 2

#### Delivery 2

- Steps B. 1 and B. 2

#### Delivery 3

- Steps C. 1 and C. 2


## 4 Processes

### *TupleSpaces* Servers

Servers must be launched by receiving their port as a single argument.
For example (**$** represents the operating system *shell*):

`$ mvn exec:java -Dexec.args="3001"`

The remote interfaces to be used for the different TupleSpaces server implementations are defined in the *proto* files provided by the faculty along with this statement.

### Front-end

The *front-end* is simultaneously a server (as it receives and responds to client requests) and a client (as it makes remote invocations to the TupleSpaces server(s)).

When launched, it receives the port on which it should offer its remote service, as well as the hostname and port pairs of the TupleSpaces servers with which it will interact (one server in variant A, three servers in the following variants).

For example, in step 1.2 (still without replication), the *front-end* could be launched like this to use port 2001 and connect to the TupleSpaces server at localhost:3001:

`$ mvn exec:java -Dexec.args="2001 localhost:3001"`

### Clients

Client processes receive commands from the console. All client processes should display the *>* symbol whenever they are waiting for a command to be entered.

For all commands, if no error occurs, client processes should print `"OK"` followed by the response message, as generated by the toString() method of the compiler-generated class `protoc`, as illustrated in the examples below.

If a command generates an error on the server side, this error should be transmitted to the client using gRPC error handling mechanisms (in the case of Java, encapsulated in exceptions). In these situations, when the client receives an exception after a remote invocation, it should simply print a message describing the corresponding error.

Both client programs receive as arguments the hostname and port where the TupleSpace frontend (or, in step 1.1, the TupleSpaces server) can be found, as well as the client ID (see step B.2). For example, the Java client can be launched like this:

`$ mvn exec:java -Dexec.args="localhost:2001 1"`

and the Python client can be launched like this:

`$ python3 client_main.py localhost:2001 1`

For step 2.2 (the *take* operation), client programs must receive as an argument a client identifier (an integer assumed to be unique across client processes).

There is a command for each service operation: `put`, `read`, `take`, and `getTupleSpacesState`.

The first three receive a string, delimited by `<` and `>` and without any spaces between these symbols, that defines a tuple or, in the case of the `read` and `take` commands, a regular expression (using Java's regular expression syntax) that specifies the desired pattern of tuples.

An example:

```bash
> put <vacancy,sd,shift1>
OK

> put <vacancy,sd,shift2>
OK

> take <vacancy,sd,shift1>
OK
<vacancy,sd,shift1>

> read <vacancy,sd,[^,]+>
OK
<vacancy,sd,shift2>
```

Starting from step B.1, any of the above commands can receive three additional *optional* integer arguments (non-negative). These integers define delays that each replica must apply before executing the request (see the description of step B.1).

There are also two additional commands, which do not result in remote invocations:

- `sleep`, which blocks the client for the number of seconds passed as the only argument.

- `exit`, which terminates the client.


## 5 Other Considerations

### The *debug* option

All processes must be able to be launched with the "-debug" option. If this option is selected, the process must print messages to "stderr" describing the actions it performs. The format of these messages is free, but should help debug the code. It should also be designed to help understand the flow of execution during the final discussion.

### Interaction Model, Failures, and Security

It should be assumed that neither servers, front-ends, nor clients can fail.

It should also be assumed that TCP connections (used by gRPC) handle situations such as message loss, reordering, or duplication.

However, messages can be arbitrarily late, so the system is asynchronous.

It is outside the scope of the project to address security-related issues (e.g., user authentication, confidentiality, or message integrity).

### Persistence

Persistent storage of server state is not required or valued.

