+++
author = "Josh Wulf"
categories = ["q#", "programming", "quantum mechanics"]
date = "2018-09-20"
description = "This week  I attended a workshop on programming Quantum computers using Q#, run by John Azariah, the creator of the Q# programming language."
featured = "john-azariah.jpeg"
featuredalt = ""
featuredpath = "date"
linktitle = ""
title = "Programming Quantum Computers with Q#"
type = "post"

+++

This week I’m at the NDC Developer Conference in Sydney. While here, I attended a workshop on programming Quantum computers using Q#, run by John Azariah, the creator of the Q# programming language.

{{< tweet 1042326993029672961 >}}

Q# is a recently released Microsoft language specifically developed for programming quantum computer operations from a classical computer. It’s supported on [Mac, Windows, and Linux](https://docs.microsoft.com/en-us/quantum/quantum-installconfig?view=qsharp-preview).

What is so exciting about Q# is that it is an abstraction of quantum computing at a new semantic level. You can express complex ideas succinctly (think of C versus Assembly Language). New levels of semantic abstraction allow for the emergence of new paradigms.

{{< fancybox path="/img/2018/09" file="dijkstra.jpeg" caption="" gallery="Gallery Name" >}}

Q# is not simply a new level of abstraction over a former, familiar one, however. Q# is a semantic abstraction over a revolutionary hardware that is still being physically implemented — a quantum computer.

You can express things in Q# that you simply cannot express in a classical computer language.

Q# is really more akin to an assembly language for quantum computers, in terms of the primitives it encapsulates. We are basically with quantum computers where we were in the late 40s / early 50s with classical computers.

## Q# Programming Model

The programming model for Q# is to treat the quantum computer as a coprocessor. It is similar to working with a GPU — the Graphics Processing Unit in your computer’s video card. The GPU is a specialised processor for crunching polygons and calculating shading. It turns out that GPUs are also good for the kind of number crunching needed for Bitcoin mining too, so people use them for that. To program a GPU, you assemble the instructions for the GPU using a domain-specific language, then send them from the computer’s main CPU to the GPU for execution.

With Q# you write the quantum operations in the domain-specific language Q#, which is a stateless, functional language, and then send them to the quantum computer from a program written in C# running on a classical CPU, which is also where you receive the eventual output from the quantum computer.

## Example Q# Code

After the workshop, I wrote a [Q# program](https://github.com/jwulf/HGate) that demonstrates a simple quantum behaviour that is distinct from the behaviour of a classical computer.

The HGate program demonstrates a special case of the famous Double-slit Experiment, where observation of an intermediate state of the system influences the behaviour of the system.

## “God does not play dice…” — Albert Einstein

To understand the behaviour displayed by this program: imagine taking a coin and starting with heads up, then flipping it. It has a 50% chance of coming up heads or tails. You check what it is, then flip it again. It has a 50% chance of coming up heads or tails again.

Pretty straight forward. Now, here is the quantum weirdness. In the quantum realm, if the coin is a particle subject to quantum effects, you flip it by sending it through an quantum logic circuit called a Hadamard gate. If you look at it after the first flip, you get a 50/50 heads/tails on that flip and on the second flip. However, if you don’t look at it after the first flip, the second flip comes up heads — _every single time_.

Albert Einstein, who first discovered Quantum Mechanics, [could not believe that the universe could operate like this](https://www.bbvaopenmind.com/en/einsteins-love-hate-relationship-with-quantum-physics/). And yet it does, because otherwise we wouldn’t have iPhones and other modern electronics, which operate at extremely small scales and exploit a number of quantum behaviours like this. Einstein spent the rest of his life [trying to prove that the quantum weirdness he discovered was not a thing](https://en.wikipedia.org/wiki/Bohr%E2%80%93Einstein_debates), unsuccessfully. And that’s why he doesn’t get the credit for it. But yeah, he published three papers at the same time — one was a proof of the existence of atoms, the second was relativity, and the third was about black body radiation, which is a quantum mechanical phenomenon.

To read a bit more about why this specific quantum behaviour happens, see the [README.md](https://github.com/jwulf/HGate/blob/master/README.md) file of the example program.

## A Q# Quantum Operation

Here is an example of a quantum operation written in Q#, taken from the example program linked above:

```
operation CoinFlip (count: Int) : (Int, Int)
{
    body
    {
        mutable numOnes = 0;
        mutable numZeros = 0;
        // Get a Qubit in Zero state
        using (qubit = Qubit[1]) {
        for (test in 1..count) {
            // Set is an operation defined elsewhere
            Set (Zero, qubit[0]);
            // Send the qubit through a Hadamard quantum logic gate
            H(qubit[0]);
            // Measure the value of the q-bit
            let state = M(qubit[0]);
            if (state == Zero) {
                set numZeros = numZeros + 1;
            }
            if (state == One) {
                set numOnes = numOnes + 1;
            }
      }
      ResetAll(qubit);       // Reset the qubit
    }
    return (numZeros, numOnes);
    }
}
```

The Q# Language Design

Q# draws on inspiration from F# as a functional language (the compiler / parser is written in F#), C# for syntax, and draws some ideas from Python (notably for in).

It is a stateless language — there is no way to hold state between quantum operations, and the measurement of state to return a value from an operation collapses the quantum state to a single real-world state. It has no variables, but uses binding of constant immutables.
Types are Tuple based, with arbitrary arity. It has non-curry Partial application support, and has Generics and Functors. Functors allow sequences of operations to be expressed and reasoned over.

The Q# compiler can do whole program analysis and reason over the code to do optimizations before sending the operations to the quantum computer. This is important because of the cost of operations, especially given the small slice of time that qubit state is coherent with current and likely (short-term) future quantum computers.

## What Problems Can Quantum Computers Solve?

Classical computers use bits that can have one of two states — one or zero. Quantum computer bits, or qubits, only have one of those two states when you look at them, but inside the quantum computer they can have probabilistic states. With this, they can model many states — especially the probabilistic state waveforms of particles. How do you do useful computations with this? Well, it’s good for modelling physical systems.

In 1911, we figured out how to make ammonia. It requires heating Nitrogen to 5000 degrees and compressing it to 50 atmospheres. This ammonia is used for gunpowder and fertiliser, and this fertiliser allowed the Green Revolution of the 60s that allowed us to double the global human population. 4% of the global energy budget goes to production of ammonia.

Nitrogenase is an enzyme in a bacteria that lives in parasitic nodules on the roots of beans. When you grow beans in a field, this enzyme fixes Nitrogen from the atmosphere into the ground, fertilising the soil. So farmers rotate crops — growing wheat, then beans, then wheat — to keep the soil fertile.

To understand how to produce the ammonia the way the bacteria does — at room temperature using H2O + N from the atmosphere — requires solving the interaction of 170 electrons. Nitrogenase has two transition metals that act as catalysts: iron and molybdenum. That means that we need 2¹⁷⁰ complex numbers to model the waveforms of the electrons. There are only 2¹⁵⁰ atoms on Earth — so you would need 1,000,000 Earths just to store the problem definition.

A quantum computer with 200 qubits can model that many states.

With that computer we can run the simulations to understand how to do it like the bacteria does. There will be additional engineering once we have the solution to build something that can do it — just like new drug compounds must be productised. And once that is done, the agricultural output of farming will be significantly higher.

## Quantum Computer Construction

In a quantum computer, there are two components to a qubit — some physical component that holds the quantum state, and an component that performs operations on the physical component.

A qubit — at least the way we are approaching it now — operates at 15 milliKelvin. Liquid Helium is 4 Kelvin.

The model of quantum computing is a generalisation of classical computing. It is, mathematically, Linear algebra. Mathematically, a qubit is a vector in a high-dimensional linear space (a Hilbert space).

You cannot observe the qubit in that space, but you can operate on it by requesting the system to apply rotational translations to it.

Current quantum computers are able to generate a physical qubit for 10^-6 seconds. After that period it decays, so error correction is needed.

There are two models of Quantum computing:

* The gate model — time evolution of quantum state using matrix multiplication. This is the model that Q# uses.
* Quantum annealing — finding the lowest energy state that solves a problem. The DWave computer uses this method.

Classical computing is a special case of quantum computing. So developments and discoveries in quantum computing are causing insights in classical computing.

## Quantum Computing Impacts

The headline poster child of Quantum Computing’s likely future impact is being able to break current encryption schemes. However, there are likely to be many more impactful changes before then.

Breaking modern cryptography will require quantum computers with 5000 qubits.

Microsoft is already rolling out post-quantum-computing-resistant encryption — including lattice-based cryptography. Modern cryptography is based on factoring large primes — classically expensive to solve, but trivial for quantum computers.

NISQC is “Noisy Intermediate Scale Quantum Computing”. Some people are developing computers that have large numbers of noisy qubits. MS is not doing this. They are working on getting their first “topological qubit” — a qubit that is resistant to decoherence. It will be more computationally relevant. They are on track to getting it this year. John hopes that in his lifetime we’ll see 1000–1,000,000 qubits on a wafer at 15milliKelvin.

As we get quantum computers online, one of the things they will help us do is model physical systems that we can use to make more efficient quantum computers.

Solving problems like Nitrogenase, or how Chlorophyll captures CO2 from the atmosphere and turns it into carbohydrates — reversing the Greenhouse effect and allowing us to create food out of thin air (and sunshine) — are closer on the horizon and will have a huge impact — as will using quantum computers to develop superconductors.

And they will also unlock problems and opportunities that we are not even considering right now. Einstein wasn’t thinking about the iPhone or the Internet when he published his paper on black body radiation.

We are living in the future right now.

## Further Resources

For a couple of great books that introduce Quantum physics without a lot of maths, I recommend:

{{< fancybox path="/img/2018/09" file="schrodingers-cat.jpeg" caption="" gallery="Gallery Name" >}}

“[In Search of Schrodinger’s Cat: Quantum Physics And Reality](https://www.amazon.com/Search-Schrodingers-Cat-Quantum-Physics-ebook/dp/B004JN1CIS/ref=sr_1_2?s=digital-text&ie=UTF8&qid=1537418130&sr=1-2&keywords=schrodingers+cat)” — a popular history of the development of Quantum Mechanics, tracing the evolution of thought and discovery through the 20th century.

{{< fancybox path="/img/2018/09" file="the-fabric-of-reality.jpeg" caption="" gallery="Gallery Name" >}}

“[The Fabric of Reality — The Science of Parallel Universes, and its Implications](https://www.amazon.com/Fabric-Reality-Parallel-Universes-Implications-ebook/dp/B005KGJX8E/ref=mt_kindle?_encoding=UTF8&me=&qid=1537412592)” — a book by David Deutsch, a pioneer of Quantum Computing. This book starts with the philosophy of science (specifically its epistemology), and goes on to examine some of the philosophical implications of quantum mechanics.

If you want to get right into it, check out “[Quantum Computing for Computer Scientists](https://pdfs.semanticscholar.org/6337/14a7b044fca5f8870ab3b2204929c99b5c72.pdf)”. This is the book that John recommends.

{{< fancybox path="/img/2018/09" file="quantum-computing.jpeg" caption="" gallery="Gallery Name" >}}

[*] There is prior art in this space — for example [Quipper](https://www.mathstat.dal.ca/~selinger/quipper/), which is implemented in Haskell. However, Q# comes in a Quantum Computing SDK that includes a 3-qubit local simulator and access to a 40-qubit cloud-based simulator. IBM has [OpenQASM](https://en.wikipedia.org/wiki/OpenQASM) — a quantum assembly programming language, which has a Scratch-like visual editor and a cloud-based (real) quantum computer platform. Q# is a higher-level language with types and control flow.