# Problem Description

Professor Natalino Caracol was hired by Ubiquity Inc., in Rovaniemi, Lapland, to develop a program to estimate the maximum profit that can be obtained from the production and sale of toys during Christmas.

The company produces a set of n wooden toys daily {x1, . . . , xn}, where each toy xi has a profit li.

In addition to a maximum production limit for each toy due to assembly line constraints, the company is limited to a maximum total number of toys that can be produced per day due to restrictions on cutting the boreal forest.

Furthermore, this Christmas, the company decided, in addition to selling each toy individually, to also sell special packs containing three different toys, whose profit is greater than the sum of the individual profits of the toys that comprise them.

The goal is to indicate to Rüdolf, CEO of Ubiquity Inc., the maximum profit that can be obtained daily.

Ubiquity Inc. will address the distribution problem later.

The implementation should be based on Python using the PuLP library for LP problem-solving (https://pypi.org/project/PuLP/).

Examples are available at https://github.com/coin-or/pulp/tree/master/examples.

**Note**: Information on what to include in the report can be found in the template available on the course page.

## Input
The input file contains information about the company's n products, profit, and production capacity for each, as follows:

* One line containing three integers: t indicating the number of different toys that can be produced, p indicating the number of special packages, and max indicating the maximum number of toys that can be produced per day;

* A list of n lines, where each line contains two integers, li and ci, indicating the profit and production capacity of toy i.

* A list of p lines, where each line contains four integers i, j, k, and lijk, indicating the profit lijk of the special bundle {i, j, k}, and the name of the products i, j, and k that constitute it.

Any integers on a line are separated by exactly one whitespace character, containing no other characters except the end of the line.


## Output
The program should write to the output an integer corresponding to the maximum profit that Rüdolf can obtain daily.

### Example 1
**Input**
```
5 2 150
50 27
30 33
45 30
40 37
35 35
1 3 5 130
2 3 4 130
```
**Output**
`6440`

### Example 2
## Input
```
5 2 15
50 27
30 33
45 30
40 37
35 35
1 3 5 129
2 3 4 130
```
## Output
`750`

## Build
```py
python3 vossoprograma.py < ficheiro_de_input
```