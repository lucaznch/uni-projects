**Base Code**

1. `CREATE <event_id> <num_rows> <num_columns>`
   * This command is used to create a new event with a room where 'event_id' is a unique identifier for the event, 'num_rows' is the number of rows, and 'num_columns' is the number of columns in the room.
   * This event is represented by an array in which each position encodes the seat status:
     * **0 indicates an empty seat;**
     * **res_id > 0 indicates a reserved seat with the reservation identifier res_id.**
   * Usage Syntax: **CREATE 1 10 20**
   * Creates an event with identifier 1 with a room with 10 rows and 20 columns.

2. `RESERVE <event_id> [(<x1>,<y1>) (<x2>,<y2>) ...]`
   * Allows you to reserve one or more seats in an existing event room.
   'event_id' identifies the event, and each pair of (x,y) coordinates specifies a seat to reserve.
   * Each reservation is identified by a strictly positive integer identifier **(res_id > 0)**.
   * Usage syntax: **RESERVE 1 [(1,1) (1,2) (1,3)]**
     * Reserve seats (1,1), (1,2), (1,3) in event 1.

3. `SHOW <event_id>`
   * Prints the current status of all seats in an event.
   Available seats are marked with '0', and reserved seats are marked with the identifier of the reservation that reserved them.
   * Usage syntax: **SHOW 1**
     * Displays the current status of seats for event 1.

4. `LIST`
   * This command lists all events created by this identifier.
   * Usage Syntax: **LIST**

5. `WAIT <delay_ms> [thread_id]`
   * Introduces a delay in command execution, useful for testing system behavior under load conditions.
   * The [thread_id] parameter is only introduced in exercise 3, and until then, it should add a delay to the only existing task.
   * Usage Syntax: **WAIT 2000**
     * Adds a delay of the next command by 2,000 milliseconds (2 seconds).

6. `BARRIER`
   * Only applicable from exercise 3 onwards; however, the command parsing already exists in the code base.

7. `HELP`
   * Provides information about the available commands and how to use them.

Input Comments:
Lines starting with the ‘**#**’ character are considered comments and are ignored by the command processor (useful for testing).
* Example: ‘# This is a comment and will be ignored’.


# PART 1
The first part of the project consists of 3 exercises.

## Exercise 1. Interaction with the File System

The base code receives requests only through the terminal (std-input).

In this exercise, you want to change the base code so that it processes batch requests obtained from files.

To do this, IST-EMS must now receive as a command-line argument the path to a "JOBS" directory, where the command files are stored.

IST-EMS must obtain the list of files with the ".jobs" extension contained in the "JOB" directory.

These files contain command sequences that follow the same syntax accepted by the base code.

IST-EMS processes all commands in each of the ".jobs" files, creating a corresponding output file with the same name and ".out" extension that reports the status of each event.

File access and manipulation should be performed through the POSIX interface based on file descriptors, rather than using the stdio.h library and the FILE stream abstraction.

Example output from the test file `/jobs/test.jobs`:
```
1 0 2
0 1 0
0 0 0
```

## Exercise 2. Parallelization using multiple processes

After completing Exercise 1, students should extend the code created so that each ".job" file is processed by a child process in parallel.

The program must ensure that the maximum number of child processes active in parallel is limited by a constant, MAX_PROC, which must be passed on the command line at program startup.

To ensure the correctness of this solution, the ".jobs" files must contain requests related to different events; that is, two ".jobs" files cannot contain requests related to the same event.

For simplicity, students do not need to ensure or verify that this condition is met (they can assume it will always be met in tests conducted during the evaluation phase).

The parent process must wait for each child process to complete and print the corresponding termination status to std-output.


## Exercise 3. Parallelization Using Multiple Threads

This exercise aims to take advantage of the possibility of parallelizing the processing of each .job file using multiple threads.

The number of threads to be used to process each .job file, **MAX_THREADS**, should be specified on the command line at program startup.

Synchronization solutions will be prioritized when accessing event status that maximize the system's achievable level of parallelism.

However, the synchronization solution developed must ensure that any operation is executed "atomically" (i.e., "all or nothing").

For example, when executing a "SHOW" operation for an event, partially filled reservations should be avoided—reservations for which only a subset of all desired seats have been assigned.

We also want to **_extend_** the set of commands accepted by the system with these two additional commands:

* **WAIT <delay_ms> [thread_id]**
* This command injects a wait of the duration specified by the first parameter into all tasks before processing the next command, if the optional thread_id parameter is not used. If this parameter is used, the delay is injected only into the task with identifier “thread_id”.

Usage examples:
* **WAIT 2000**
* All tasks must wait 2 seconds before executing the next command.
* **WAIT 3000 5**
* The task with thread_id = 5, the 5th task to be activated, waits 3 seconds before executing the next command.

* **BARRIER**

Forces all tasks to wait for the completion of the commands prior to **BARRIER** before resuming execution of subsequent commands.

To implement this functionality, tasks, upon encountering the **BARRIER** command, should return from the function executed by pthread_create, returning an ad hoc return value (e.g., 1) to indicate that they encountered the **BARRIER** command and that they have not finished processing the command file (in this case, the tasks should return a different return value, e.g., 0).

The main task, that is, the task that starts the "worker" tasks using pthread_create(), should observe the return value returned by the worker tasks using pthread_join and, if it detects that the **BARRIER** command has been encountered, start a new round of parallel processing that should resume after the **BARRIER** command.

Usage examples:
* **BARRIER**
* All tasks must reach this point before proceeding with their next commands.

This exercise should ideally be performed using the code obtained after solving Exercise 2.

In this case, the achievable degree of parallelism will be **MAX_PROC * MAX_THREADS**.

However, no penalties will be applied if the solution to this exercise is performed using the solution to Exercise 1.



# PART 2

The second part of the project consists of two exercises aimed at:
1. **making IST-EMS accessible to client processes through named pipes**,
2. **allowing interaction with IST-EMS through signals**.

### Base Code
The provided base code provides a server implementation that corresponds to a possible solution from the first part of the project, without all the code related to reading files (it was moved to the client) and creating threads and processes (it contains, in particular, the synchronization logic between tasks, mainly in the operations.c file).

It also contains an empty client API implementation and a client that receives the path to a .jobs file and calls the API for each of the commands in the file.

The commands used in this part of the project are the same as in the first part, with the exception of BARRIER, which no longer exists in this release, and WAIT, which no longer receives the thread_id argument and is executed on the client side.

## Exercise 1. Interacting with Client Processes via Named Pipes
IST-EMS should become a standalone server process, launched as follows:
`ems pipe_name`

Upon startup, the server must create a named pipe whose name (pathname) is the one indicated in the argument above.

It is through this pipe that client processes can connect to the server and send login requests.

Any client process can connect to the server's pipe and send a message requesting the start of a session.

This request contains the names of two named pipes that the client previously created for the new session.

It is through these named pipes that the client will send future requests to the server and receive the corresponding responses from the server within the scope of the new session.

Upon receiving a session request, the server assigns a unique identifier to the session, called session_id, and associates the names of the named pipes specified by the client with this session_id.

The server then responds to the client with the session_id of the new session.

The server accepts a maximum of S simultaneous sessions, each with a distinct session_id, where session_id is a value between [0, S - 1], where S is a constant defined in the server code.

This implies that the server, when it receives a new login request and has S active sessions, must freeze, waiting for a session to end so it can create a new one.

A session lasts until either **1.** the client sends a session end message or **2.** the server detects that the client is unavailable.

In the following subsections, we describe the IST-EMS client API in more detail, as well as the content of the request and response messages exchanged between clients and the server.


### IST-EMS API
To allow client processes to interact with IST-EMS, there is a programming interface (API) in C, which we refer to as the IST-EMS Client API.

This API allows the client to have programs that establish a session with a server and, during that session, invoke operations to access and modify the state of events managed by IST-EMS.

This API is presented below.

The following operations allow the client to establish and terminate a session with the server:
* __int ems_setup(char const *req_pipe_path, char const *resp_pipe_path, char const *server_pipe_path)__
* Establishes a session using the named pipes specified in the argument. The named pipes used for exchanging requests and responses (i.e., after the session is established) must be created (by calling mkfifo) using the names passed in the 1st and 2nd arguments.
The server's named pipe must already be created by the server, and the corresponding name is passed in the third argument.
On success, the session_id associated with the new session will be stored in a client variable indicating which session the client currently has active; additionally, all pipes will have been opened by the client.
Returns 0 on success, 1 on error.

* **int ems_quit()**
* Terminates an active session, identified in the respective client variable, closing the named pipes that the client had open when the session was established and deleting the client named pipe. Returns 0 on success, 1 on error.

With an active session, the client can invoke the following operations on the server, whose specifications are identical to those of the server's homonymous operations:
* **int ems_create(unsigned int event_id, size_t num_rows, size_t num_cols)**
* __int ems_reserve(unsigned int event_id, size_t num_seats, size_t* xs, size_t* ys)__
* **int ems_show(int out_fd, unsigned int event_id)**
* **int ems_list_events(int out_fd)**
* Both ems_show and ems_list_events receive a file descriptor to which they should print their output, in the same format as the first part of the project.

Different client programs can exist, all invoking the API indicated above (concurrently with each other). For simplicity, the following assumptions should be made:
* Client processes are single-threaded, meaning that a client's interaction with the server is sequential (a client only sends a request after receiving the response to the previous request).
* Client processes are correct, meaning they meet the specification described in the remainder of this document. In particular, it is assumed that no client sends messages with a format outside the specified format.

![API](./api.png)


### Request-Response Protocol
The content of each message (request and response) must follow the following format:

`int ems_setup(char const *req_pipe_path, char const* resp_pipe_path, char const *server_pipe_path)`
- Request and Response Messages
  - (char) OP_CODE=1 | (char[40]) client pipe name (for requests) | (char[40]) Client pipe name (for responses)
  - (int) session_id

----

`int ems_quit(void)`
- Request and Response Messages
  - (char) OP_CODE=2
  - <no response>

----

`int ems_create(unsigned int event_id, size_t num_rows, size_t num_cols)`
- Request and Response Messages
  - (char) OP_CODE=3 | (unsigned int) event_id | (size_t) num_rows | (size_t) num_cols
  - (int) return (as per base code)

----

`int ems_reserve(unsigned int event_id, size_t num_seats, size_t* xs, size_t* ys)`
- Request and Response Messages
  - (char) OP_CODE=4 | (unsigned int) event_id | (size_t) num_seats | (size_t[num_seats]) contents of xs | (size_t[num_seats]) contents of ys
  - (int) return (as per base code)

----

`int ems_show(int out_fd, unsigned int event_id)`
- Request and Response Messages
  - (char) OP_CODE=5 | (unsigned int) event_id
  - (int) return (as per base code) | (size_t) num_rows | (size_t) num_cols | (unsigned int[num_rows * num_cols]) seats

----

`int ems_list_events (int out_fd)`
- Request and Response Messages
  - (char) OP_CODE=6
  - (int) return (as per base code) | (size_t) num_events | (int unsigned[num_events]) ids

----

Where:
* The symbol **|** denotes the concatenation of elements in a message.
For example, the request message associated with the ems_quit function consists of a byte (char) followed by an integer (int).
* All request messages begin with a code that identifies the requested operation (OP_CODE).
Except for ems_setup requests, OP_CODE is followed by the session_id of the current client session (which must have been stored in a client variable when calling ems_setup).
* Strings containing pipe names are fixed-length (40).
For shorter names, additional characters must be padded with '\0'.
* The buffer returned by ems_show must follow row-major order.
* In the event of an error in ems_show or ems_list_events, the server must send only the error code.


### Two-Stage Implementation
Given the complexity of this requirement, it is recommended that the solution be developed gradually, in two stages, as described below.

## Stage 1.1: IST-EMS Server with Single Session
In this phase, the following simplifications should be assumed (which will be eliminated in the next requirement):
* The server is single-threaded.
* The server accepts only one session at a time (i.e., S=1).

> [!TIP]
> Try it out:
> Run the test provided in jobs/test.jobs on your IST-EMS client-server implementation. Confirm that the test completes successfully.
> Build and experiment with more elaborate tests that explore different functionalities offered by the IST-EMS server.


## Step 1.2: Support for Multiple Concurrent Sessions

In this step, the solution developed so far must be extended to support the following more advanced aspects.

On the one hand, the server must support multiple concurrently active sessions (i.e., S>1).

On the other hand, the server must be able to handle requests from different sessions (i.e., different clients) in parallel, using multiple threads (pthreads), including:
* The initial server thread must be responsible for receiving requests arriving at the server through its pipe, and for this reason, the host thread is called.
* There are also S worker threads, each associated with a session_id and dedicated to serving requests from the client corresponding to this session. The worker threads must be created when the server starts.

The host thread coordinates with the worker threads as follows:
* When the host thread receives a login request from a client, the host thread inserts the request into a producer-consumer buffer. Worker tasks extract requests from this buffer and communicate with the respective client through the named pipes that the client will have previously created and communicated with the session establishment request. Synchronization of the producer-consumer buffer must be based on condition variables (in addition to mutexes).

> [!TIP]
> Try it out:
> Try running the client-server tests you created earlier, but now launching them concurrently from two or more client processes.


## Exercise 2. Signal Interaction
Extend IST-EMS so that the SIGUSR1 handling routine is redefined on the server.
Upon receiving this signal, the IST-EMS (server) must remember that, as soon as possible, but outside the signal handling function, the main thread should print to std-output the identifier of each event, followed by the status of their locations, just like the SHOW in the first exercise.
Since only the main thread that receives client calls should listen for SIGUSR1, all threads serving a specific client must use the pthread_sigmask function to inhibit (with the SIG_BLOCK option) the reception of SIGUSR1.

**Starting Point.**
To solve Part 2 of the project, groups can choose to use their solution from Part 1 of the project as a basis or access the new code base. If you choose to use the solution from the first phase of the project as a starting point, you can take advantage of the synchronization logic between tasks.
However, at this stage of the project, the IST-EMS server runs in only one process.
Therefore, the extensions developed in the first phase of the project to achieve parallelization across multiple processes cannot be used for this part of the project.


