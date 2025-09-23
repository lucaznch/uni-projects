# Problem Description

Engineer João Caracol was hired by the SuperMarble factory to optimize one of its marble slab cutting lines.

The line receives a marble slab that must be cut to produce pieces with the dimensions required by the factory's customers.

The line features a two-disc machine that can cut slabs from one side to the other.

The cutting process works as follows:
* The slab is cut vertically or horizontally;
* Each of the two new slabs produced is either re-entered or removed from the cutting line if it matches the dimensions of one of the pieces to be produced or if it is no longer possible to convert it into a piece.

The factory is currently able to continue full production, so priority must be given to manufacturing higher-value pieces.

Engineer Caracol's objective is to:
* **build a program that, given a slab of marble, calculates the maximum value that can be obtained from it by cutting it into pieces corresponding to the dimensions requested by the customer.**

Engineer Caracol can produce multiple copies of the same piece as he sees fit.

More specifically: the line receives a rectangular slab of marble with dimensions **X × Y**.

Furthermore, Engineer Caracol has access to a list of **n** types of pieces to be produced, all with different dimensions.

Each type of piece **i ∈ {1, ..., n}** corresponds to a rectangle of marble with dimensions **ai × bi** and is sold at a price **pi**.

Note: **pieces can be rotated => 2x3 <=> 3x2**


## Input

The input file contains the dimensions of the sheet to be cut and the dimensions of the various types of parts requested.
These values ​​are represented as follows:
* The first line contains two positive integers **X** and **Y**, separated by a space, which correspond to the sheet dimensions;
* The second line contains a positive integer **n**, which corresponds to the number of types of parts that can be produced;
* **n** lines describing each of the **i** types of parts that can be produced. Each line consists of three positive integers **ai**, **bi**, and **pi** separated by a space, where **ai × bi** correspond to the dimensions of the part type and **pi** to the price of the part.

## Output

You should write to the output the maximum value that can be obtained from the sheet given as input.
If no parts can be produced, simply print 0.


## Examples

**Input 1**
```
1 3
2
1 1 1
1 3 10
```
**Output 1**

`10`


**Input 2**
```
3 20
3
2 2 4
1 5 10
3 7 20
```
**Output 2**

`120`


**Input 3**
```
7 4
2
6 3 130
1 2 5
```
**Output 3**

`155`


**Input 4**
```
4 3
2
3 3 10
3 2 6
```
**Output 4**

`12`


# Compilation
- C++: `g++ -std=c++11 -O3 -Wall file.cpp -lm`
- C: `gcc -O3 -ansi -Wall file.c -lm`
- Rust: `rustc --edition=2021 -C opt-level=3 file.rs`
- Javac: `javac File.java`
- Java: `java -Xss32m -Xmx256m -classpath . File`
- Python: `python3 file.py`

