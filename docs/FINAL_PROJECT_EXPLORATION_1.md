

# Final Project Exploration

## Topic
A topic that interests me is code performance evaluations. This is because recently I finished my MQP on compiler optimizations. To evaluate the results, we used Eigen (a c++ lin alg library) which had a useful performance testbench. The issue we had using the resulting data is that it emitted as bunch of json blobs of different operations, so we largely look through the data manually and created simple line graphs to identify operations with any significant improvements.

So my idea for the project is build a tool for easily distinguish the performance increase of different compiler flags and options.

(The data set is manually generated using Eigen's testbench, an example of the dataset's format is in public/bench_fft.json)

## Questions to be answered
With the project I'm hoping to answer the following questions
* How significant is the difference in compiler commands on test-bench performance
* How are the improvements effected by different matrix shapes
* Which matrix optimizations see the most change

## Inspiration / Related Visualizations

https://www.dsogaming.com/news/amd-reveals-official-details-prices-specs-and-performance-for-ryzen-7000-cpu-series/

The article includes a bar graph showing the performance gains by a cpu across multiple games. The style makes the overall performance increases immediately visible on first glance, then as read more through it, you can gain a better understanding of the exact performance improvements over different games and applications. Though it should be noted that this method opens the door to heavy cherry picking as only a select use cases are chose over a wide variety of options.

https://kihlander.net/post/swapping-memory-and-compiler-optimizations/

The article on compiler optimization includes a line graph showing the speed vs buffer size for an optimization. The graph could've been more use full in displaying the information, however the graph also included many flaws hindering its usefulness. The issue lies in that the speeds of the different items is initially very high before rapidly decreasing and flatlining close together near the bottom for the majority of the graph, making it difficult to parse and understand. The graph more serves as inspiration for when a graph needs to be scaled in order to be interpretable or shown in a different format.

## Proposed Visualizations
<img width="2992" height="2992" alt="1000058988" src="https://github.com/user-attachments/assets/c089334d-2904-415e-b770-31e1ba0a971b" />

### Overlayed Line Graph
(bottom left in image)
the first and also simplest is allowing the user to select an operation and overlaying the graphs of the performance metric (differs between operations) vs matrix size of the different compiled versions of Eigen. For improved usability the different compile options should be toggle-able. 

### Grid of Matrix Sizes
(top left in image)
The second would display the performance as a grid, with each axis being the matrix size in different directions. The user would then select two compiler options and an operation, and the relative performance would be displayed for each matrix width and height in the grid. This would be done through color, with a brighter green indicating stronger performance greens, a brighter red indicating performance loss, and white being no significant difference. The exact metrics would be shown for each size combination when the mouse hovers over the cell. 

### Performance over operation types
(right side of image)
The last would allow the user to explore the performance of operation types (sparse matrices, Eigen, FFT, core, etc.). This would be done with a bar chart showing the performances of both compiler options with the exact percent increase about the bar. Clicking an operation type would then change the display to instead be showing the different operations of that just as was done before allowing a more fine understanding of how the performance differences compare between operations.


## Task Analysis



My goal is to determine the extent that the vectorization of code using SIMD instructions has on performance. And to further determine how the performance increases compare between auto-vectorization (a compiler optimization) and hand-vectorization (an optimization made by the developer). Vectorization has the impact on code which involves a significant amount of iteration, and so I want to determine the performance impact on linear algebra operations which exemplify the target use case of the optimization.

### Auto- vs Hand-Vectorization
The core use of the program is to give the user an understanding for how the performance of auto- and hand-vectorized code compares to the equivalent non-vectorized code. In developing highly optimized code, vectorization can enable further performance improvements. Modern compilers are able to accomplish this for simple loops, however may fail to vectorize more complex instances. Hand-vectorization can take full advantage of the performance increases, however requires developer time to implement the optimization. The visualization should allow the performance trade of between the two options to be determined. 

### Performance over Scale
The visualization should also demonstrate how the performance of the code is effected by the problem size. In this instance it will be done as the size of the matrix used in the operation.



### Impact by Operation Type
The testbench which provides the performance stat data, does so over multiple operation types (sparse matrices, Eigen, etc.), each of which contains multiple related operations. I want the visualization to provide a simple interface to view the the different types and operations to determine how the performance improvements varies between the operations. 


## Validation

### Domain Situation

I think my biggest user would be someone who's interested in SIMD vectorization, and who has maybe implemented the instruction to optimize a few simple use cases. The person would be curious on comparing the different performance gains from use in vectorization. The main question I believe they would have is whether the current state of auto-vectorization is able to compare with hand-vectorization for prime use cases for it (e.g. very iterative tasks). A more professional user may be someone deciding if implementing vectorized code is the right choice for their current project. The visualization would allow them to understand the benefits and use that to compare with the trade-offs involved with utilizing them. 

With the benefit of surveying the users I could confirm if Eigen is a good use case to base it on as it is a project more favorable to vectorization, or if a different project less ideal for it would better meet what they'd want to see. 

### Data/Task Abstraction

The task be done using the visualization is to understand the relative performance of vectorization over varying tasks. The goal would to be able to clearly understand the performance difference of a task and to be able to move focus between different tasks/use-cases to compare them.

The Data would be abstracted by the averaging the results of the testbench over different operations and getting the relational difference between the 3 methods (scalar, auto-vectorized, and hand-vectorized).

### Visual Encoding

The data will be visually encoded in two ways. The first would directly compare the different vectorization methods on one task, allowing a user to grasp the performance differences, and ideally include how it is effected by another variable (i.e. the matrix size of Eigen operations). This would be achieved over a line chart displaying each method. The Second would simplify the per operation performances (such as averaging performance across all matrix sizes) in order to allow space to factor in more tasks displayed simultaneously. This would be achieved by a series of bar charts, with each bar showing performances over one operation.
The visualization should allow a simple way to move between the abstractions and quickly between the operations being compared.

### Algorithm

Due the the fact that recompiling and running the testbenches is a slow process, the visualization will be implemented by storing the results once for all combinations and accessing it as a large data set, the largest issue is avaoided. However this has the disadvantage that it limits how many combanations can be used, as implementing all of them would become infeasible. Without re-running the data collection, the only remaining process is to compare different data sets and average over sections of them.
