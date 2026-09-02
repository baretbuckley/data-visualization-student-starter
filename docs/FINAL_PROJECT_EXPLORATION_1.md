

A topic that interests me is code performance evaluations. This is because
recently I finished my MQP on compiler optimizations. To evaluate the results,
we used eigen (a c++ lin alg library) which had a useful performance testbench.
The issue we had using the resulting data is that it emited as bunch of json blobs of different operations,
so we largly look through the data manually and created simple line graphs to identify operations with any significant improvments.

So my idea for the project is build a tool for easily distinguish the performance increase of different compiler flags and options.
Some of the questions I would like to answer with it is how different compiler options, impact performance on varying matrix sizes and matrix operations

I had 3 ideas for how I could visualize the data:

(bottom left in image)
the first and also simpilist is allowing the user to select an operation
and overlaying the graphs of the performance vs matrix size of the different compiled versions of eigen

(top left in image)
The second would prompt the user to select two versions of the compiler options and would display the
comparison over a grid with the axis being matrix width and height, then the comparison can be shown through
color intensity (brighter green being greater increase, brighter red being a greater decrease). The goal in this
would be to determing if the performance gains are biased to a wider or taller matrix.

(right side of image)
The last would allow the user to explore the different operations based on their type (sparce matricies, eigen, FFT, core, etc.)
It would then display the relative performance as a bar chart with all metrics averaged together of that type. The user can then click one of the bar graphs and see the performance differences of each operation of the selected type. 

The data set was created by me using the Eigen testbench, an example of the data's format is in public/bench_fft.json