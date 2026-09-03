

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


