var styleSettings = {
	defaultStyle: [{
		title: undefined,
		minScale: undefined,
		maxScale: undefined,
		stroke: {
			color: 'rgba(0,0,0,1.0)',
			lineDash: undefined,
			width: 2
		},
		fill: {
			color: 'rgba(0,0,0,0.5)',
		},
		icon: {
			src: undefined,
			scale: undefined
		},
		circle: {
			stroke: 'rgba(0,0,0,1.0)',
			fill: 'rgba(0,0,0,0.5)',
			radius: 10
		}
	}], //end defaultStyle
	mask: [
		[{
			stroke: {
				color: 'rgba(0,0,0,1.0)'
			},
			fill: {
				color: 'rgba(0,0,0,1.0)'
			}
		}]
	],
	pagaende_detaljplaner: [
		[{
			maxScale: 10000,
			stroke: {
				color: 'rgba(255,0,0,1.0)',
				width: 3,
				lineDash: [10, 10],				
			},	
			fill: {
				color: 'rgba(255,255,255,0.1)'
			}
		}],[{	
			minScale: 10000,		
			stroke: {
				color: 'rgba(255,0,0,1.0)',
				width: 4,
				lineDash: [10, 10]				
			},	
			fill: {
				color: 'rgba(255,255,255,0.1)'
			}
		}]
	],	
	gallande_detaljplaner: [
		[{
			maxScale: 10000,
			stroke: {
				color: 'rgba(0,132,168,1.0)',
				width: 2
			},	
			fill: {
				color: 'rgba(190,210,255,0.5)'
			}
		}],[{
			minScale: 10000,		
			stroke: {
				color: 'rgba(0,132,168,1.0)',
				width: 4
			},	
			fill: {
				color: 'rgba(190,210,255,0.5)'
			}
		}]
	],
	ledig_naringsmark: [
		[{
			fill: {
				color: 'rgba(56,168,0,0.7)'
			},		
			stroke: {
				color: 'rgba(38,115,0,1.0)',
				width: 2
			},	
			filter: '[typ] != ""'
		}]
	],	
	etableringsomraden: [
		[{
			stroke: {
				color: 'rgba(24,69,1,1.0)',
				lineDash: [10, 10],				
				width: 4
			},
			fill: {
				color: 'rgba(24,69,1,0.2)'
			}
		}]
	],	
	cykelvagar: [
		[{
			stroke: {
				color: 'rgba(219,117,49,1.0)',
				lineDash: [7,3],
				width: 3
			}
		}]
	],		
	fmis_punkt: [
		[{
			icon: {
				size: [32,32],
				src: 'data/svg/fornlamning.svg',
			}
		}]
	],
	fmis_linje: [
		[{
			stroke: {
				color: 'rgba(147,126,28,0.9)',
				width: 3
			}
		}]
	],
	fmis_polygon: [
		[{
			fill: {
				color: 'rgba(147,126,28,0.5)',
			}
		}]
	],	
	karta_gra: [
		[{
			image: {
				src: 'data/png/gra.png'
			}
		}]
	],
	karta_farg: [
		[{	
			image: {
				src: 'data/png/farg.png'
			}
		}]
	],
	orto: [
		[{
			image: {
				src: 'data/png/orto.png'
			}
		}]		
	]		

} //end styleSettings